# Bootstrap lesson

- create bootstrap folder, the 4 script files and the package.json inside it
- add the following lines to the root package.json file

```json
    "bootstrap-up": "pnpm -F @root/bootstrap run bootstrap-up-script",
    "bootstrap-down": "pnpm -F @root/bootstrap run bootstrap-down-script",
```

then run the following command

```
$ pnpm run bootstrap-up
```

This will bootstrap the system.

To remove the bootstrap resources run

```
$ pnpm run bootstrap-down
```
