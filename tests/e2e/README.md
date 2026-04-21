## Description

This repo contains typescripts for Suse Security UI extension automation

## Requirements
Before running automation, make sure testing node has access to the cluster with SBOM scanner installed:

- A Kubernetes cluster 
- SBOM scanner with UI extension installed
- npm and nvm installed on the testing node
- nodejs version 24 installed on the testing node

## Setup

- clone test repo and install all necessary packages

```bash

git clone https://github.com/neuvector/security-ui-exts.git
cd security-ui-exts/tests/e2e
npm init playwright@latest
npm install dotenv
```

Note: choose TypeScript and browser installed while initialising playwright

## Configure

- Update run.sh with node sudo password (NODESUDOPASSWORD)
- Update .auth/user.json with Rancher admin password (RANCHERUSERPASSWORD)
- Update all typescript files with Rancher URL (RANCHERURL)
- Update all typescript files with Rancher admin password (RANCHERUSERPASSWORD)
- Update ts and bash scripts with node ip and port of a webserver (NODEIP:PORT)

```bash
grep NODESUDOPASSWORD * -r | awk -F: '{print $1}' | grep -v README |xargs sed -i 's/NODESUDOPASSWORD/<sudouserpassword>/'
grep RANCHERURL * -r | awk -F: '{print $1}' | grep -v README |xargs sed -i 's/RANCHERURL/<rancherurl>/'
grep RANCHERUSERPASSWORD * -r | awk -F: '{print $1}' | grep -v README |xargs sed -i 's/RANCHERUSERPASSWORD/<rancheradminpassword>/'
grep NODEIP:PORT * -r | awk -F: '{print $1}' | grep -v README |xargs sed -i 's/NODEIP:PORT/<webserver ip:port>/'
```

## Run all tests under tests directory

```bash
./run.sh
```

## Test result

- Test results are copied to `_reports_` directory with time stamp
- Test report links are updated to pw_report_summary.html

## Accessing test result from a web browser

- copy pw_report_summary.html to a webserver
- copy `_reports_` directory to a webserver
- http:/webserverip/pw_report_summary.html

```bash
sudo cp pw_report_summary.html /var/www/html/
sudo cp -r _reports_/ /var/www/html/
```
