export PATH=/usr/local/bin:$PATH
export PATH=$PATH:/usr/local/mysql/bin
export PATH="$PATH":~/.node/bin
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads
export PATH="$PATH":/Users/ferdinand/.node/bin
# RabbitMQ Config
export PATH=$PATH:/usr/local/sbin
# export PATH=$HOME/.local/bin

export PYTHON_CONFIGURE_OPTS="--enable-framework"
eval "$(pipenv --completion)"

