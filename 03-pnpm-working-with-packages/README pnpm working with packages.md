# Adding packages to projects using the pnpm add command

## Add the react package to app1

- add the react software library package to app1 with this command

```bash
pnpm --filter @ui/app1 add react@19.2.0
```

- now inspect the package.json file and you will see

```json
{
  "name": "@ui/app1",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)"
  },
  "dependencies": {
    "react": "19.2.0"
  }
}
```

notice how the node\_-_modules folder has been created

and also pnpm-lock.json

# create a .gitignore file to remove the unwanted commit suggestions

- add the file .gitignore containing the following

```
node_modules
```

## Add typescript to app1

- add the typescript tool package to app1 with this command

this time we don't specify the version, so we just get the latest version

```bash
pnpm --filter @ui/app1 add -D typescript

```

- now inspect the package.json file and you will see

```json
{
  "name": "@ui/app1",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)"
  },
  "dependencies": {
    "react": "19.2.0"
  },
  "devDependencies": {
    "typescript": "5.9.3"
  }
}
```

typecript has been added to the dev_dependencies section

now lets run the typescript compiler

- add the ts command to app1's package.json file to look like this

```json
{
  "name": "@ui/app1",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)",
    "ts": "tsc --version"
  },
  "dependencies": {
    "react": "19.2.0"
  },
  "devDependencies": {
    "typescript": "5.9.3"
  }
}
```

- now run this command on your machine

```bash
pnpm --filter @ui/app1 run ts
```

- add the ts-app1 (and ts-app2) command(s) to the workspace's package.json file to look like this

```json
{
  "name": "root",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)",
    "msg-app1": "pnpm -C ui/app1 run msg",
    "msg-apps": "pnpm -r msg",
    "msg-all": "pnpm  -F '*' msg",
    "ts-app1": "pnpm -C ui/app1 run ts",
    "ts-app2": "pnpm -C ui/app1 run ts"
  }
}
```

and run it ...

```bash
prun ts-app1
```

TypeScript responds

```
Version 5.9.3
```

# Adding Projects by editing the package.json file

## add typescript developer tool to app2 by editing the app2/package.json file

- update ./ui/app2/package.json file so that it looks like this

```json
{
  "name": "@ui/app2",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)",
    "ts": "tsc --version"
  },
  "dependencies": {
    "react": "19.2.0"
  },
  "devDependencies": {
    "typescript": "5.9.3"
  }
}
```

- now run the command

```bash
pnpm install
```

This will automatically detect that the app2 package.json requires typescript and add it to the project.

You can now see a node_modules symbolic link has been created for pnpm to find the typescript and react packages

- Run this command

```bash
prun ts-app2
```

and you will see that typescript has indeed been installed there.

# Enable a full clean of all node modules with a single command

- add a clean command to the scripts section of the app1 package.json so it looks like this:

```json
{
  "name": "@ui/app1",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)",
    "ts": "tsc --version",
    "cleanup": "rm -rf node_modules"
  },
  "dependencies": {
    "react": "19.2.0"
  },
  "devDependencies": {
    "typescript": "5.9.3"
  }
}
```

- and to the scripts section of the app2 package.json so it looks like this:

```json
{
  "name": "@ui/app2",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)",
    "ts": "tsc --version",
    "cleanup": "rm -rf node_modules"
  },
  "dependencies": {
    "react": "19.2.0"
  },
  "devDependencies": {
    "typescript": "5.9.3"
  }
}
```

- add a clean command to the scripts section of the root package.json so it looks like this:

```json
{
  "name": "root",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo hello world",
    "touch-app1": "pnpm -F @ui/app1 run touch",
    "delete-app1": "pnpm -F @ui/app1 run delete",
    "ts1": "pnpm -F @ui/app1 run ts",
    "ts2": "pnpm -F @ui/app2 run ts",
    "cleanup": "rm -rf node_modules",
    "clean-all": "pnpm -F '*' cleanup"
  }
}
```

Now run the command

```
prun clean-all
```

Notice how all the node_modules folders have disappeared.

- now run the command

```bash
pnpm install
```

This will re-install all packages required by all projects in the entire repo.

Test it with these commands

```bash
prun ts-app1
prun ts-app2
```
