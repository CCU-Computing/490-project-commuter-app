# Documentation

## Setting up the environement

> 1.  First thing is to know which OS system that you will be using. For this I will be using Ubuntu Linux.
> 2.  Next is to set up your IDE, any text editor will work, however I prefer Visual Studio Code (VS Code as I will refer to it)
> 3.  Once you have your IDE set up next will be to install node.js, this is where you can run and test your code. This is done in multiple ways, however I prefer to use the command line to do so
>     - First you will want to ensure your system is running the latest software so you will want to run the command:
>       `sudo apt update && sudo apt upgrade`
>     - Next you will want to ensure install from the repository
>       `sudo apt install nodejs npm`
> 4.  Finally you need to set up docker. Similarly I prefer to use the command line. - First you will need to get the repository over HTTPS:
>     `sudo apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release` - Then, add the docker official GPG key:
>     `curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg` - Next, you will need to add the docker repository:
>     `echo \ "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null` - Finally, you will need install it:
>     `sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`

## Notes

To build this project in docker use:

`docker build -t commuter-app .`

`docker run -p 3000:3000 -p 8081:8081 commuter-app`

> - If running the environment in a container extra steps may be required and will be tailored to your own system.
>
> - On Windows 11 PowerShell blocks the script (npm.ps1) the first time node.js. To fix that open PowerShell as administrator and then type:
>
>   Set-ExecutionPolicy RemoteSigned - Scope CurrentUser
>
>   Then Enter Y, when asked. The problem should disapper after that.
