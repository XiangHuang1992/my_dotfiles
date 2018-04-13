#!/bin/bash
root=/tmp/aitools

[ -d $root ] || mkdir -m=777 $root
[ -d $root/bin ] || mkdir -m=777 $root/bin
[ -d $root/jobs ] || mkdir -m=777 $root/jobs
[ -d $root/jobs/submissions ] || mkdir -m=777 $root/jobs/submissions
[ -d $root/jobs/instances ] || mkdir -m=777 $root/jobs/instances

#The below file is the max job running concurrence
[ -f $root/jobs/concurrent ] || cat <<'EOF' >$root/jobs/concurrent
5
EOF

#The below file is for waiting a semaphore
[ -f $root/.wait.1 ] || cat <<'EOF' >$root/.wait.1
#!/bin/bash
function check()
{
    (
        flock -s $FD
        read -u $FD c
        if [[ $c -gt 0 ]]; then
            return 0
        else
            return 1
        fi
     ) {FD}<>$1
} 

function acquire()
{
    (
        flock -x $FD
        read -u $FD c
        if [[ $c -gt 0 ]]; then
            echo $((c - 1)) >/dev/fd/$FD
            return 0
        else
            return 1
        fi
    ) {FD}<>$1
}

while : ; do
    while ! check $1; do
        sleep 1
    done
    if acquire $1; then
        exit 0
    fi
done
exit 1
EOF

#The below file is for release a semaphore
[ -f $root/.release.1 ] || cat <<'EOF' >$root/.release.1
#!/bin/bash
(
    flock -x $FD
    read -u $FD c
    echo $((c + 1)) >/dev/fd/$FD
    exit 0
) {FD}<>$1
EOF

#The below file is for releasing reference number
[ -f $root/.detach.1 ] || cat <<'EOF' >$root/.detach.1
#!/bin/bash
(
    flock -x $FD
    read -u $FD c
    echo $((c - 1)) >/dev/fd/$FD
    if [[ $c -eq 1 ]]; then
        exit 0
    else
        exit 1
    fi
) {FD}<>$1
EOF

if [ ! -f $root/bin/jq ]; then
    wget https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64 -q -O $root/bin/jq
    chmod +x $root/bin/jq
fi

#The below bash script will run on remote machine and start running a new job
[ -f $root/jobs/.jobentrypoint.2 ] || cat <<'EOF' >$root/jobs/.jobentrypoint.2
#!/bin/bash
function writeState()
{
    $root/bin/jq -n --arg state $1 --arg time "`date +'%F %T.%N %z'`" '.state=$state | .timestamp=$time' >>$idir/job.logs.json
}
[ -f ~/.profile ] && source ~/.profile
root=/tmp/aitools
idir=$root/jobs/instances/$1
JOB_CONCURRENCE_DATA=/tmp/aitools/jobs/concurrent
IFS=$'\n' array=( `$root/bin/jq -r '.command, .workingDirectory' $idir/job.properties.json` )
command=${array[0]}
workingDirectory=${array[1]}
echo $$ >$idir/.jobpid
writeState Queued
$SHELL /tmp/aitools/.wait.1 $JOB_CONCURRENCE_DATA
code=$?
if [[ $code -eq 143 ]]; then
writeState Cancelled
exit
elif [[ $code -ne 0 ]]; then
writeState Error
exit
fi
writeState Running
cd $idir/script/$workingDirectory
export PYTHONUNBUFFERED=yes
export LOG_DIR="$idir/log"
export OUTPUT_DIR="$idir/output"
exec 3>&1 4>&2 1>$idir/log/stdout 2>$idir/log/stderr
eval $command
code=$?
exec 1>&3 2>&4
if [[ $code -eq 0 ]]; then
writeState CompletedSuccess
elif [[ $code -eq 143 ]]; then
writeState Cancelled
else
writeState CompletedFailure
fi
$SHELL /tmp/aitools/.release.1 $JOB_CONCURRENCE_DATA
rm $idir/.jobpid
EOF

#The below bash script will run on remote machine and start running a new job
[ -f $root/jobs/.jobdistribute.3 ] || cat <<'EOF' >$root/jobs/.jobdistribute.3
#!/bin/bash
root=/tmp/aitools
sdir=$root/jobs/submissions
function distribute()
{
    jobId=`cat /proc/sys/kernel/random/uuid`
    sdir=$root/jobs/submissions/$1
    idir=$root/jobs/instances/$jobId
    mkdir -p $idir
    mkdir -p $idir/log
    mkdir -p $idir/output
    grep -v '^\s*//' $sdir/.vscode/ai_job_properties.json | $root/bin/jq ". as \$root | {} | .author=\$root.job.author | .name=\$root.job.name | .type=\$root.job.type | .command=(\$root.job.startupCommand + \" \" + \$root.job.startupScript + \" \" + \$root.job.arguments + \" \" + \$root.job.batchArguments[$2]) | .workingDirectory=\$root.job.workingDirectory" >$idir/job.properties.json
    ln -s $sdir $idir/script
    $SHELL /tmp/aitools/jobs/.jobentrypoint.2 $jobId &
}
mkdir $sdir/$1
tar -zxf $sdir/$1.tar.gz -C $sdir/$1
rm $sdir/$1.tar.gz
args=`grep -v '^\s*//' $sdir/$1/.vscode/ai_job_properties.json | $root/bin/jq '.job.batchArguments | length'`
[ $args -eq 0 ] && args=1 
echo $args >$sdir/$1/.jobcitation
for i in `seq 0 $((args - 1))`; do
    distribute $1 $i
done
EOF

#The below bash script will run on remote machine and cancel a job
[ -f $root/jobs/.jobcancel.2 ] || cat <<'EOF' >$root/jobs/.jobcancel.2
#!/bin/bash
root=/tmp/aitools
jobs=()
for jobId in $@
do
    idir=$root/jobs/instances/$jobId
    state=1
    if [ -d $idir ]; then
        [ -f $idir/.jobpid ] && { pkill -P `cat $idir/.jobpid` && state=0; rm $idir/.jobpid; }
    fi
    jobs+=( "`$root/bin/jq -n --indent 0 --arg jobId $jobId --arg state $state '.jobId=$jobId | .state=($state | tonumber)'`" )
done
echo [`IFS=, ; echo "${jobs[*]}"`]
EOF

#The below bash script will run on remote machine and delete a job instance and may delete its referenced job submission
[ -f $root/jobs/.jobdelete.2 ] || cat <<'EOF' >$root/jobs/.jobdelete.2
#!/bin/bash
root=/tmp/aitools
jobs=()
for jobId in $@
do
    idir=$root/jobs/instances/$jobId
    state=1
    if [ -d $idir ]; then
        sdir=`readlink -f $idir/script`
        $SHELL $root/.detach.1 $sdir/.jobcitation
        code=$?
        rm -r $idir
        if [ $code -eq 0 ]; then
            rm -r $sdir
        fi
        state=0
    fi
    jobs+=( "`$root/bin/jq -n --indent 0 --arg jobId $jobId --arg state $state '.jobId=$jobId | .state=($state | tonumber)'`" )
done
echo [`IFS=, ; echo "${jobs[*]}"`]
EOF

#The below bash script will run on remote machine and fetch all possible task state
[ -f $root/jobs/.joblist.2 ] || cat <<'EOF' >$root/jobs/.joblist.2
#!/bin/bash
root=/tmp/aitools
function listjobs() {
    function writeState()
    {
        $root/bin/jq -n --arg state $1 --arg timestamp "`date +'%F %T.%N %z'`" '.state=$state | .timestamp=$timestamp' >>$idir/job.logs.json
    }
    jobs=()
    for jobId in $@
    do
        idir=$root/jobs/instances/$jobId
        [ -f $idir/.jobpid ] && { kill -0 `cat $idir/.jobpid` 2>/dev/null || { writeState Interrupted; rm $idir/.jobpid; } }
        jobs+=( "`cat $idir/job.properties.json $idir/job.logs.json |\
        $root/bin/jq -s --indent 0 --arg jobId $jobId '.[0] as $properties | del(.[0]) | .[0:] as $logs | $properties | .id=$jobId | .logs=$logs'`" )
    done
    jobsStr=[`IFS=, ; echo "${jobs[*]}"`]
    serverTime=`date +'%F %T.%N %z'`
    $root/bin/jq -n --indent 0 --arg serverTime "$serverTime" --argjson jobs "$jobsStr" '.serverTime=$serverTime | .jobs=$jobs'
}
export root
export -f listjobs
ls $root/jobs/instances | xargs $SHELL -c 'listjobs $0 $@'
EOF

#The below bash script will run on remote machine and fetch specific job detail
[ -f $root/jobs/.jobdetail.2 ] || cat <<'EOF' >$root/jobs/.jobdetail.2
#!/bin/bash
function writeState()
{
    $root/bin/jq -n --arg state $1 --arg timestamp "`date +'%F %T.%N %z'`" '.state=$state | .timestamp=$timestamp' >>$idir/job.logs.json
}
root=/tmp/aitools
jobs=()
for jobId in $@
do
    idir=$root/jobs/instances/$jobId
    [ -f $idir/.jobpid ] && { kill -0 `cat $idir/.jobpid` 2>/dev/null || { writeState Interrupted; rm $idir/.jobpid; } }
    stderrLog=`tail -n 20 $idir/log/stderr`
    jobs+=( "`cat $idir/job.properties.json $idir/job.logs.json |\
    $root/bin/jq -s --indent 0 --arg jobId $jobId --arg stderrLog "$stderrLog"\
    '.[0] as $properties | del(.[0]) | .[0:] as $logs | $properties | .id=$jobId | .logs=$logs | .stderr=$stderrLog'`" )
done
jobsStr=[`IFS=, ; echo "${jobs[*]}"`]
serverTime=`date +'%F %T.%N %z'`
$root/bin/jq -n --indent 0 --arg serverTime "$serverTime" --argjson jobs "$jobsStr" '.serverTime=$serverTime | .jobs=$jobs'
EOF