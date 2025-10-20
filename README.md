
<h1 align="center">OpenLake Infrastructure</h1>

<p align="center">
A unified repository containing all automation tools, scripts, configurations, and bots that keep OpenLake’s operations running smoothly.
</p>

<p align="center">
    <img src="https://img.shields.io/badge/Status-Deployed-brightgreen" alt="Status: Deployed" />
    <img src="https://img.shields.io/badge/Development-Ongoing-blue" alt="Development: Ongoing" />
    <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License: MIT" />
</p>

<p align="center">
    <img src="https://img.shields.io/github/issues-pr-closed/OpenLake/openlake-infra?color=success" alt="Pull Requests Merged" />
    <img src="https://img.shields.io/github/issues/OpenLake/openlake-infra?color=orange" alt="Open Issues" />
    <img src="https://img.shields.io/github/contributors/OpenLake/openlake-infra" alt="Contributors" />
</p>

---

## Repository Links <sup>[↥ Back to top](#table-of-contents)</sup>
- **Main Repository:** [OpenLake](https://github.com/OpenLake)
- **This Project Repository:** [openlake-infra](https://github.com/OpenLake/openlake-infra)

---

## Table of Contents
1. [About the Project](#about-the-project)
2. [Getting Started](#getting-started)
3. [Usage](#usage)
4. [Contributing](#contributing)
5. [Maintainers](#maintainers)
6. [License](#license)

---

## About the Project <sup>[↥ Back to top](#table-of-contents)</sup>

The **OpenLake Infrastructure** repository is the backbone of OpenLake’s internal systems.  
It consolidates all the tools, scripts, bots, and configurations that streamline operations across OpenLake’s projects and servers.

### 🧩 Key Goals
- Automate repetitive DevOps and community management tasks.
- Manage and monitor OpenLake’s servers, bots, and GitHub automations.
- Provide a transparent and organized place for infrastructure-related contributions.

### 👥 Target Audience
- **OpenLake developers** who maintain our servers, repositories, and bots.
- **Contributors** looking to add automation or improve operational efficiency.

### 🌊 Part of the OpenLake Ecosystem
This project supports other OpenLake projects by maintaining their infrastructure — ensuring smooth CI/CD pipelines, community automation, and reliable server uptime.

---

## Getting Started <sup>[↥ Back to top](#table-of-contents)</sup>

### Prerequisites
Install dependencies based on the module you want to run.

```bash
# For Node.js scripts
npm install

# For Python scripts
pip install -r requirements.txt
````

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/OpenLake/openlake-infra.git
   cd openlake-infra
   ```

2. Copy and configure environment variables:

   ```bash
   cp .env.example .env
   ```

3. Refer to the `/docs` folder for detailed setup instructions for each module (bots, servers, actions, etc.).

---

## Usage <sup>[↥ Back to top](#table-of-contents)</sup>

Each component is modular and self-contained.

### Example: Run a Discord Bot

```bash
cd bots/discord
npm start
```

### Example: Execute a GitHub Action Script Locally

```bash
act -j cleanup-old-branches
```

### Example: Deploy VPS Configuration

```bash
bash server/vps-configs/deploy.sh
```

More examples and configurations are available in their respective folders.

---

## Contributing <sup>[↥ Back to top](#table-of-contents)</sup>

We welcome contributions from OpenLake members and the community!
If you’ve created a bot, automation, or useful script that enhances OpenLake operations — feel free to open a PR.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

---

## Maintainers <sup>[↥ Back to top](#table-of-contents)</sup>

Current Maintainers: [@OpenLake-Core](https://github.com/OpenLake)
See [MAINTAINERS.md](MAINTAINERS.md) for the full list.

---

## License <sup>[↥ Back to top](#table-of-contents)</sup>

Distributed under the **MIT License**.
See [LICENSE](LICENSE) for more details.
