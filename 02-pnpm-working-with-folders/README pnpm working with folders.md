# working with folders

## Create Subfolder package in ui/app1

- create the folders "ui" and "ui/app1"
- create a file in ui/app1 called package.json containing this

```json
{
  "name": "application1",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)"
  }
}
```

## Three Ways to Run Script commands in a subfolder

- first, create three terminals side by side all in the root folder
- then in each of them do the following

### Terminal 1

```bash
cd ./ui/app1
pnpm run msg
```

Which will print

Current folder: /Users/richardbray/src/monorepo/ui/app1

### Terminal 2

```bash
pnpm --dir ui/app1 msg
pnpm -C ui/app1 msg
```

Which will print (twice)

Current folder: /Users/richardbray/src/monorepo/ui/app1

### Terminal 3

First

- create ./pnpm-workspace.yaml containing the following

```yaml
packages:
  - ui/app1
```

```bash
pnpm --filter application1 msg
pnpm -F application1 msg
```

Which will print (twice)

Current folder: /Users/richardbray/src/monorepo/ui/app1

## TWO ways to run scripts of the same name in multiple folders

- create the folder "ui/app2" containing a package.json as follows

```json
{
  "name": "application2",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)"
  }
}
```

- update pnpm-workspace.yaml to the following

```yaml
packages:
  - ui/*
```

### 1. Only Subfolders : use the --recursive flag (-r)

- run this pnpm command to invoke

```bash
pnpm --recursive run msg
pnpm -r run msg
```

Which will print

Current folder: /Users/richardbray/src/monorepo/ui/app1
Current folder: /Users/richardbray/src/monorepo/ui/app2

### 2. Subfolders and the root folder : use the --filter flag (-F)

- to include the root msg you do do it this way :

```bash
pnpm --filter '*' msg
pnpm -F '*' msg
```

Which will print

Current folder: /Users/richardbray/src/monorepo
Current folder: /Users/richardbray/src/monorepo/ui/app1
Current folder: /Users/richardbray/src/monorepo/ui/app2

## save time with root script commands

- edit ./package.json and replace the contents with this

```json
{
  "name": "root",
  "version": "1.0.0",
  "scripts": {
    "msg": "echo Current folder: $(pwd)",
    "msg-app1": "pnpm -C ui/app1 run msg",
    "msg-apps": "pnpm -r msg",
    "msg-all": "pnpm -F '*' msg"
  }
}
```

Now you can run the commands

```bash
prun msg
prun msg-app1
prun msg-apps
prun msg-all
```
