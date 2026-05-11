# Create new repo

- create a new folder called "monorepo"
- open it in Visual Studio code
- go to Source Control on the activity bar (menu View->Source Control)
- Hit the "Initialize Repository" button
- Go to Explorer on the activity bar (menu View->Explorer)
- add a file called ".gitignore" which contains the following

```
node_modules/
dist/
cdk.out/
*.log
.DS_Store
```

- go back to Source Control on the activity bar
- add a short message and commit the change

# Set the Visual Studio Code default terminal to the bash terminal

- Select Menu View-CommandPalette
- Enter Terminal: Select Default Profile
- click on "bash" to make this the default terminal

You can now open a new bash terminal in a number of ways including the keyboard shortcuts

- MAC
  - Command-Shift-Comma
  - Command-J (toggles it open/closed)

- WINDOWS
  - Control-Shift-Comma
  - Control-J (toggles it open/closed)

# Initialize pnpm

- Go to Explorer on the activity bar (menu View->Explorer)
- open a new bash terminal (see above)
- enter this command

```bash
pnpm init
```

- it creates quite a verbose package.json file - more than we need
- edit package.json and replace entire contents with this

```json
{
  "name": "root",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)"
  }
}
```

# run some pnpm commands in the root

This is pnpm "shorthand" for running scripts

```bash
pnpm msg
```

This is the full version

```bash
pnpm run msg
```

This is the silent flag

```bash
pnpm run --silent msg
```

This is the shorthand version of the silent flag

```bash
pnpm run -s msg
```

# Create a bash shell alias to shorten commands

I use this alias all the time and will do throughout this course

- edit ~/.bash_profile
- add this line to the end of the file

```bash
alias prun="pnpm --silent run"
```

- rerun .bash_profile in your current terminal with this command

```bash
source ~/.bash_profile
```

- now use the alias ... enter the command

```bash
prun msg
```
