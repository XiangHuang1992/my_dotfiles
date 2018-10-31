#!/bin/bash
root=/tmp/aitools

[ -d $root ] || mkdir -m=777 $root
[ -d $root/bin ] || mkdir -m=777 $root/bin
[ -d $root/jobs ] || mkdir -m=777 $root/jobs
[ -d $root/jobs/submissions ] || mkdir -m=777 $root/jobs/submissions
[ -d $root/jobs/instances ] || mkdir -m=777 $root/jobs/instances

#The below file is the max job running concurrence
if [ ! -f $root/jobs/semaphores ]; then
    echo 5 >$root/jobs/semaphores
    chmod 666 $root/jobs/semaphores
fi

if [ ! -f $root/bin/wait.vscode.1 ]; then
cat <<'EOF' >$root/bin/wait.vscode.1
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
chmod +x $root/bin/wait.vscode.1
fi

if [ ! -f $root/bin/release.vscode.1 ]; then
cat <<'EOF' >$root/bin/release.vscode.1
#!/bin/bash
(
    flock -x $FD
    read -u $FD c
    echo $((c + 1)) >/dev/fd/$FD
    exit 0
) {FD}<>$1
EOF
chmod +x $root/bin/release.vscode.1
fi

if [ ! -f $root/bin/detach.vscode.1 ]; then
cat <<'EOF' >$root/bin/detach.vscode.1
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
chmod +x $root/bin/detach.vscode.1
fi

if [ ! -x $root/bin/jq ]; then
chmod +x $root/bin/jq
fi

if [ ! -f $root/bin/jobentrypoint.vscode.3 ]; then
cat <<'EOF' >$root/bin/jobentrypoint.vscode.3
#!/bin/bash
root=`readlink -f $0 | xargs dirname | xargs dirname`
idir=$root/jobs/instances/$1
function writeState()
{
    $root/bin/jq -n --arg state $1 --arg time "`date +'%F %T.%N %z'`" '.state=$state | .timestamp=$time' >>$idir/job.logs.json
}
JOB_CONCURRENCE_DATA=$root/jobs/semaphores
[ -f ~/.profile ] && source ~/.profile
IFS=$'\n' array=( `$root/bin/jq -r '.command, .workingDirectory' $idir/job.properties.json` )
command=${array[0]}
workingDirectory=${array[1]}
echo $$ >$idir/.jobpid
writeState Queued
$SHELL $root/bin/wait.vscode.1 $JOB_CONCURRENCE_DATA
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
if [ -f "$idir/.containerid" ];then
    containerId=`cat $idir/.containerid`
    containerUser=`cat $idir/.containeruser`
    $root/bin/dockerexec.vscode.1 $containerId $containerUser "cd $idir/script/$workingDirectory;"$command
else
    eval $command
fi
code=$?
exec 1>&3 2>&4
if [[ $code -eq 0 ]]; then
writeState CompletedSuccess
elif [[ $code -eq 143 ]]; then
writeState Cancelled
else
writeState CompletedFailure
fi
$SHELL $root/bin/release.vscode.1 $JOB_CONCURRENCE_DATA
rm $idir/.jobpid
if [ -f "$idir/.containerid" ];then
    containerId=`cat $idir/.containerid`
    docker stop $containerId
    docker rm $containerId
    rm $idir/.containerid
    rm $idir/.containeruser
fi
EOF
chmod +x $root/bin/jobentrypoint.vscode.3
fi

if [ ! -f $root/bin/jobdistribute.vscode.5 ]; then
cat <<'EOF' >$root/bin/jobdistribute.vscode.5
#!/bin/bash
root=`readlink -f $0 | xargs dirname | xargs dirname`
sdir=$root/jobs/submissions
array=()
package=$1
containId=$2
containerUser=$3
packageId=`echo ${package%.tar.gz} | xargs basename`
state=1
if [ -f $package ]; then
    mkdir $sdir/$packageId && tar -zxf $package -C $sdir/$packageId && rm $package
    instances=`cat $sdir/$packageId/.vscode/ai_job_properties.json | $root/bin/jq '.job.batchArguments | length'`
    chmod -R 755 $sdir/$packageId
    [[ instances -eq 0 ]] && instances=1
    echo $instances >$sdir/$packageId/.jobcitation
    chmod 666 $sdir/$packageId/.jobcitation
    for i in `seq 0 $((instances - 1))`; do
        jobId=`cat /proc/sys/kernel/random/uuid`
        idir=$root/jobs/instances/$jobId
        mkdir -p $idir
        mkdir -p $idir/log
        mkdir -p $idir/output
        if [ ! -z "$2" ]; then
            echo $2 > $idir/.containerid
        fi
        if [ ! -z "$3" ]; then
            echo $3 > $idir/.containeruser
        fi
        cat $sdir/$packageId/.vscode/ai_job_properties.json | $root/bin/jq ".job + . | del(.job) | . as \$root | \$root | .command=\$root.startupCommand + \" \" + \$root.startupScript + \" \" + \$root.arguments + \" \" + \$root.batchArguments[$i]" >$idir/job.properties.json
        ln -s $sdir/$packageId $idir/script
        $root/bin/jobentrypoint.vscode.3 $jobId >/dev/null &
    done
    state=0
fi
array+=( "`$root/bin/jq -n --indent 0 --arg packageId $packageId --arg state $state '.packageId=$packageId | .state=($state | tonumber)'`" )

echo [`IFS=, ; echo "${array[*]}"`]
EOF
chmod +x $root/bin/jobdistribute.vscode.5
fi

if [ ! -f $root/bin/jobcancel.vscode.3 ]; then
cat <<'EOF' >$root/bin/jobcancel.vscode.3
#!/bin/bash
root=`readlink -f $0 | xargs dirname | xargs dirname`
array=()
for jobId in $@
do
    idir=$root/jobs/instances/$jobId
    state=1
    if [ -d $idir ]; then
            [ -f $idir/.jobpid ] && { pkill -P `cat $idir/.jobpid` && state=0; rm $idir/.jobpid; }
    fi
    array+=( "`$root/bin/jq -n --indent 0 --arg jobId $jobId --arg state $state '.jobId=$jobId | .state=($state | tonumber)'`" )
done
echo [`IFS=, ; echo "${array[*]}"`]
EOF
chmod +x $root/bin/jobcancel.vscode.3
fi

if [ ! -f $root/bin/jobdelete.vscode.3 ]; then
cat <<'EOF' >$root/bin/jobdelete.vscode.3
#!/bin/bash
root=`readlink -f $0 | xargs dirname | xargs dirname`
array=()
for jobId in $@
do
    idir=$root/jobs/instances/$jobId
    state=1
    if [ -d $idir ]; then
        sdir=`readlink -f $idir/script`
        $SHELL $root/bin/detach.vscode.1 $sdir/.jobcitation
        code=$?
        rm -r $idir
        if [ $code -eq 0 ]; then
            rm -r $sdir
        fi
        state=0
    fi
    array+=( "`$root/bin/jq -n --indent 0 --arg jobId $jobId --arg state $state '.jobId=$jobId | .state=($state | tonumber)'`" )
done
echo [`IFS=, ; echo "${array[*]}"`]
EOF
chmod +x $root/bin/jobdelete.vscode.3
fi

if [ ! -f $root/bin/joblist.vscode.3 ]; then
cat <<'EOF' >$root/bin/joblist.vscode.3
#!/bin/bash
root=`readlink -f $0 | xargs dirname | xargs dirname`
function writeState()
{
    $root/bin/jq -n --arg state $1 --arg timestamp "`date +'%F %T.%N %z'`" '.state=$state | .timestamp=$timestamp' >>$idir/job.logs.json
}
array=()
serverTime=`date +'%F %T.%N %z'`
instances=( `ls $root/jobs/instances` )
for jobId in ${instances[*]}
do
    idir=$root/jobs/instances/$jobId
    [ -f $idir/.jobpid ] && { kill -0 `cat $idir/.jobpid` 2>/dev/null || { writeState Interrupted; rm $idir/.jobpid; } }
    array+=( "`cat $idir/job.properties.json $idir/job.logs.json |\
        $root/bin/jq -s --indent 0 --arg jobId $jobId '.[0] as $properties | del(.[0]) | .[0:] as $logs | $properties | .id=$jobId | .logs=$logs'`" )
done
arrayStr=[`IFS=, ; echo "${array[*]}"`]
$root/bin/jq -n --indent 0 --arg serverTime "$serverTime" --argjson jobs "$arrayStr" '.serverTime=$serverTime | .jobs=$jobs'
EOF
chmod +x $root/bin/joblist.vscode.3
fi

if [ ! -f $root/bin/jobdetail.vscode.3 ]; then
cat <<'EOF' >$root/bin/jobdetail.vscode.3
#!/bin/bash
root=`readlink -f $0 | xargs dirname | xargs dirname`
function writeState()
{
    $root/bin/jq -n --arg state $1 --arg timestamp "`date +'%F %T.%N %z'`" '.state=$state | .timestamp=$timestamp' >>$idir/job.logs.json
}
joarraybs=()
for jobId in $@
do
    idir=$root/jobs/instances/$jobId
    [ -f $idir/.jobpid ] && { kill -0 `cat $idir/.jobpid` 2>/dev/null || { writeState Interrupted; rm $idir/.jobpid; } }
    stderrLog=`tail -n 20 $idir/log/stderr`
    array+=( "`cat $idir/job.properties.json $idir/job.logs.json |\
    $root/bin/jq -s --indent 0 --arg jobId $jobId --arg stderrLog "$stderrLog"\
    '.[0] as $properties | del(.[0]) | .[0:] as $logs | $properties | .id=$jobId | .logs=$logs | .stderr=$stderrLog'`" )
done
arrayStr=[`IFS=, ; echo "${array[*]}"`]
serverTime=`date +'%F %T.%N %z'`
$root/bin/jq -n --indent 0 --arg serverTime "$serverTime" --argjson jobs "$arrayStr" '.serverTime=$serverTime | .jobs=$jobs'
EOF
chmod +x $root/bin/jobdetail.vscode.3
fi

if [ ! -f $root/bin/jobvisualize.vscode.1 ]; then
cat <<'EOF' >$root/bin/jobvisualize.vscode.1
#!/bin/bash
tbpids=$(ps ux | grep tensorboard | grep -v grep | awk '{print $2}')
for pid in $tbpids
do
    [[ $pid != "" ]] && kill -9 $pid
done
if [[ $# > 1 ]]; then
    interval=$1
    shift
    tblog=$(mktemp)
    CUDA_VISIBLE_DEVICES=" " tensorboard --reload_interval $interval --port 0 --logdir $* >$tblog 2>&1 &
    for i in $(seq 1 10)
    do
        sleep 1
        if [ -s $tblog ]; then
            sleep 1
            port=$(cat $tblog | grep -E "^TensorBoard [0-9.]+" | grep -Eo ":[0-9]+")
            port=${port:1}
            if [[ $port != "" ]]; then
                echo $port
                exit 0
            else
                cat $tblog >&2
                exit 1
            fi
        fi
    done
    echo "Timeout for launching TensorBoard." >&2
    exit 1
else
    echo "No log directory provided in arguments." >&2
    exit 1
fi
EOF
chmod +x $root/bin/jobvisualize.vscode.1
fi

if [ ! -f $root/bin/launch.vscode.1 ]; then
cat <<'EOF' >$root/bin/launch.vscode.1
#!/bin/bash
root=`readlink -f $0 | xargs dirname | xargs dirname`
[ -f $root/versions/$1 ] || exit 127
shift
eval "$root/bin/$*"
EOF
chmod +x $root/bin/launch.vscode.1
fi

if [ ! -f $root/bin/usermapping.vscode.1 ]; then
cat <<'EOF' >$root/bin/usermapping.vscode.1
#!/bin/bash
groupadd --gid "${HOST_USER_GID}" "${USER}" &&useradd --uid ${HOST_USER_ID} --gid ${HOST_USER_GID} --shell /bin/bash ${USER}
if [ -z "${USER}" ]; then
    echo "We need USER to be set!"; exit 100
fi
# if both not set we do not need to do anything
if [ -z "${HOST_USER_ID}" -a -z "${HOST_USER_GID}" ]; then
    echo "Nothing to do here." ; exit 0
fi
# reset user_id to either new id or if empty old
USER_ID=${HOST_USER_ID:=$USER_ID}
USER_GID=${HOST_USER_GID:=$USER_GID}
LINE=$(grep -F "${USER}" /etc/passwd)
# replace all ':' with a space and create array
array=( ${LINE//:/ } )
# home is 5th element
USER_HOME=${array[4]}
sed -i -e "s/^${USER}:\([^:]*\):[0-9]*:[0-9]*/${USER}:\1:${USER_ID}:${USER_GID}/"  /etc/passwd
sed -i -e "s/^${USER}:\([^:]*\):[0-9]*/${USER}:\1:${USER_GID}/"  /etc/group
chown -R ${USER_ID}:${USER_GID} ${USER_HOME}
# mark current runtime context is Docker container
exec su - "${USER}"
EOF
chmod +x $root/bin/usermapping.vscode.1
fi

if [ ! -f $root/bin/dockerrun.vscode.1 ]; then
cat <<'EOF' >$root/bin/dockerrun.vscode.1
#!/bin/bash
root=`readlink -f $0 | xargs dirname | xargs dirname`
mountRoot=`readlink -f $root | xargs dirname`
if [ -d "/home/$USER" ];then
    homeMountOption="-v /home/$USER:/home/$USER"
    bashCmd="bash $root/bin/usermapping.vscode.1"
else
    homeMountOption=""
    bashCmd=""
fi

if [[ "$2" == "NvidiaDocker" ]]; then
    nvidia-docker run -dit -e HOST_USER_ID=$(id -u) -e HOST_USER_GID=$(id -g) -e USER=$USER $homeMountOption -v $mountRoot:$mountRoot $1 $bashCmd
else
    docker run -dit -e HOST_USER_ID=$(id -u) -e HOST_USER_GID=$(id -g) -e USER=$USER $homeMountOption -v $mountRoot:$mountRoot $1 $bashCmd
fi
EOF
chmod +x $root/bin/dockerrun.vscode.1
fi

if [ ! -f $root/bin/dockerexec.vscode.1 ]; then
cat <<'EOF' >$root/bin/dockerexec.vscode.1
#!/bin/bash
containerId=$1
shift
containerUser=$1
shift
if [ "$containerUser" == "$USER" ]; then
    docker exec $containerId bash -c "su - $USER -c '$*'"
else
    docker exec $containerId bash -i -c "$*"
fi
EOF
chmod +x $root/bin/dockerexec.vscode.1
fi