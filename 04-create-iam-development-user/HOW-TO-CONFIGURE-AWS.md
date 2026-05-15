# Instructions for configuring AWS CLI

- login to AWS as root
- go to management console
- from console home search for IAM (identity and access management) and open it
- create a user "dev"
  - has access to management console = true
  - permission options : Attach policies directly - choose "AdministratorAccess" (note that this user is all powerful - be careful not to allow others to access your computer)
  - one the user is created, whilst still logged in as root, select the user and go to the security credentials tab
  - setup MFA immediately (this account must be highly secure because it can create AWS resources which cost money)
  - create a new access key
    - use case = "command line interface (CLI)
    - check the [x] "i understand the above recommendations ..." confirmation box and hit next
    - for a description tag enter something like DESKTOP MACHINE NAME xxxx
    - press "create access key"
    - when you see the dialog box then open a terminal application simultaneously and enter the command

    ```
    aws configure
    ```

    - you will be prompted for the access key and secret access key into
    - copy them from the browser window
    - select your local region (there is a dropdown at the top right of the management console screen) - for example mine is eu-west-2

# Check you are correctly configured

Try running these commands which should return your AWS Account ID, user name and region

```
aws sts get-caller-identity --query Account --output text
aws sts get-caller-identity --query Arn --output text
aws configure get region
aws iam list-users --query 'Users[*].UserName' --output text
aws iam list-attached-user-policies --user-name dev
```
