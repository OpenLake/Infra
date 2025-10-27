 

# Openlake Helper Bot

A Discord bot built with [discord.js](https://discord.js.org/) to assist the Openlake organization by tracking GitHub issues, pull requests, and providing timely notifications and updates directly within Discord channels.

---

## Overview

Openlake Helper Bot serves as an organizational assistant for the Openlake community. It monitors GitHub repositories to count and track issues and pull requests, providing real-time notifications and summaries to keep contributors and maintainers informed.

This bot improves collaboration and transparency by ensuring everyone stays updated about ongoing development activities without leaving Discord.

---

## Features

* **Issue Tracking:** Automatically count and report the number of open, closed, and total issues in Openlake repositories.
* **Pull Request Monitoring:** Track pull request statuses and notify channels about new, merged, or closed PRs.
* **Custom Notifications:** Send configurable alerts for important events, such as issue creation or PR review requests.
* **Summary Reports:** Generate periodic summaries of repository activities.
* **Easy Configuration:** Designed to be flexible and adaptable to Openlake’s workflow needs.

---

## Getting Started

### Prerequisites

* Node.js (v16 or above)
* A Discord bot token (from the Discord Developer Portal)
* GitHub personal access token (for API access to track issues and PRs)
* Access permissions to Openlake repositories (read access)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/openlake-org/openlake-helper-bot.git
cd openlake-helper-bot
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add the following environment variables:

```
DISCORD_TOKEN=your_discord_bot_token
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_ORG=openlake-org
```

4. Configure the bot settings in `config.json` or relevant config files (if applicable).

### Running the Bot

```bash
npm start
```

---

## Usage

Once the bot is online and invited to your Discord server:

* It will automatically fetch and update issue and PR counts for configured repositories.
* Notifications will be sent to designated channels on specific GitHub events.
* Use bot commands (if any) to get on-demand reports or updates.
  *(Example commands can be added based on implementation)*

---

## How It Works

* The bot uses the GitHub REST API to fetch data about issues and pull requests from Openlake repositories.
* It listens for events or periodically polls the API to keep data updated.
* Using the Discord.js library, it posts messages, updates, and notifications to specified channels.
* The bot can be extended to add more functionality as Openlake’s needs grow.

---

## Contribution

Contributions from the community and organization members are welcome! Please follow the standard [GitHub workflow](https://docs.github.com/en/get-started/quickstart/contributing-to-projects) for issues and pull requests.

---

## License

[MIT License](LICENSE)

---

## Contact

For questions or support, please reach out to the Openlake maintainers or open an issue in this repository.

