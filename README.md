# security-ui-exts

### Development environment setup
#### Environment requirement

##### VM server
- Linux
- kubernetes
- Rancher manager 2.11 and up
##### Local computer
- node.js v24 and up
- npm 10 and up

#### Backend installation

##### Rancher manager
- [Installing/Upgrading Rancher](https://ranchermanager.docs.rancher.com/getting-started/installation-and-upgrade)

##### Vulnerability Scanner UI Extension
- In Tech preview phase, the UI extension is not registered into Rancher UI extension chart, thus the user needs to add the reposiory of Vulnerability Scanner UI Extension manually.
  1. Open Apps > Repositories page, click the `Create` button
  ![](/pkg/vulnerability-scanner/assets/img/doc/repositories.png)
  2. In the create repository page, enter a unique name. In the `Target` section, select `Git repository containing Helm chart or cluster template definitions`, and fill `https://github.com/neuvector/security-ui-exts.git` into the `Git Repo URL` field, fill `gh-pages` into the `Git Branch` field. Then click `Create` button and wait until the state of the new repository changes into `Active`.
  ![](/pkg/vulnerability-scanner/assets/img/doc/create_reposiory.png)
  ![](/pkg/vulnerability-scanner/assets/img/doc/repository_added.png)
  3. Open Extensions page, find Vulnerability Scanner in `Available` tab, and install the latest version.
  ![](/pkg/vulnerability-scanner/assets/img/doc/extensions.png)
  4. Open Vulnerability Scanner page, install the backend service step by step. Until all the steps are completed, the Dashboard page is shown when opening Vulnerability Scanner page.
  ![](/pkg/vulnerability-scanner/assets/img/doc/install_1.png)
  ![](/pkg/vulnerability-scanner/assets/img/doc/install_2.png)
  5. For uninstallation, after the Vulnerability Scanner backend or CNPG is removed from the Rancher UI, the command-line output will list the remaining CRDs and warn that they have been retained. To completely remove the installation, these CRDs must also be deleted manually before reinstalling the application through the UI.

#### Frontend development environment setup

- Pull the code to your local computer
- Run `yarn` to install dependency packages
- Run `API=<Rancher UI's URL> yarn dev` to start the Rancher manager UI with security-ui-ext

#### Open the UI on local computer
https://localhost:8005/