# react-library-generator

**ReactLibraryGenerator** is a package that prepares all the necessary files and folders for a new react library.

## Usage
```sh
npx @fizzmod/react-library-generator
```

## Options
- Package name / module name (required): The package name also the main module class name.
Spaces and dashes will be converted into TitleCase for class names and dash-case for file names and directories.

- Package scope (optional): The package scope for npm, if exists, the generator will ask you for use the scope name as package containing directory.

- Target path prefix (default: `/var/www/`)

- Target directory (default: `/var/www/package-name`): The package target directory. If the target directory already exists, it must be empty before continue.

- Package description (optional): A short package description that will used in `package.json` and `README.md`.

- Setup package repository and dependencies (default: `true`): Confirm if you want to initialize a git repository and run npm install into your package.

### If case you want to setup the package repository you will recieve the next options:

- Repository (required): Select the repository that your package will use. If you select GitHub or BitBucket you will asked for confirmation of the git repository remote origin, (default: `true`) also you can anyway type the full repository URL if you want or if you select the "Other" option before.

- User name (required): Type the user name for the package git repository.

- User email (required): Type the user email for the package git repository.


### Notes
- The package-generator doesn't deletes the new package directory in case of error.

- The package-generator only can create a new package if the target directory not exists or is empty.