 require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const express = require("express");


const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Web service running on port ${process.env.PORT || 3000}`);
});

// ---------------------- DISCORD CLIENT ----------------------
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

// ---------------------- DATABASE ----------------------
const mongoClient = new MongoClient(process.env.ACCESS_URL);
let postedM, userPoints;

async function initDB() {
    await mongoClient.connect();
    const db = mongoClient.db("discordBot"); // db name can be anything you like
    postedM = db.collection("postedM");
    userPoints = db.collection("user_points");
    console.log("✅ MongoDB connected");
}

// ---------------------- VARIABLES ----------------------
const repoConfig = require('./database/repoChannels.json');
const REPO_CHANNELS = repoConfig.repos;
const GENERAL_CHANNEL_NAME = repoConfig.generalChannel;

const FETCH_INTERVAL = 1000 * 60 * 4;

// ---------------------- FETCH PRs & ISSUES ----------------------
async function fetchPRsAndIssues(repo) {
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const prUrl = `https://api.github.com/repos/${repo}/pulls`;
    const issuesUrl = `https://api.github.com/repos/${repo}/issues`;

    try {
        const [prsResponse, issuesResponse] = await Promise.all([
            fetch(prUrl, { headers }),
            fetch(issuesUrl, { headers })
        ]);

        const prs = await prsResponse.json();
        const issues = await issuesResponse.json();

        return {
            prs: Array.isArray(prs) ? prs : [],
            issues: Array.isArray(issues) ? issues : []
        };
    } catch (error) {
    //    console.error(`❌ Error fetching PRs & issues for ${repo}:`, error);
        return { prs: [], issues: [] };
    }
} 
// ---------------------- SIMPLE LEVEL SYSTEM ----------------------
function pointsForLevel(level) {
    return (level - 1) * level * 5;  
    // Level 2 = 10, Level 3 = 30, Level 4 = 60, Level 5 = 100, ...
}

function getLevel(points) {
    let level = 1;
    while (points >= pointsForLevel(level + 1)) {
        level++;
    }
    return level;
}


// ---------------------- MESSAGE-BASED POINTS ----------------------
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const userId = message.author.id;  // stable unique ID
    const username = message.author.username;
    const guild = message.guild;

    try {
        // Increment or insert
        const result = await userPoints.findOneAndUpdate(
    { userId },
    {
        $inc: { points: 1 },
        $set: { user: username, userId } // update username if it changed
    },
    { upsert: true, returnDocument: "after" } // for MongoDB v4+
    // If still not working, try: { upsert: true, returnOriginal: false }
);

    // Safely get updated points
    const totalPoints = result?.value?.points || result?.points || 0;

    const newLevel = getLevel(totalPoints);
    const oldLevel = getLevel(totalPoints - 1);
        // Level up check
        if (newLevel > oldLevel) {
        // Prefer channel ID (safer)
            const generalChannel = guild.channels.cache.get(GENERAL_CHANNEL_NAME);

            if (generalChannel && generalChannel.isTextBased()) {
                await generalChannel.send(
                    `🎉 <@${userId}> has reached **Level ${newLevel}** !`
                );
            } 
            // else {
               
            //     // console.error("⚠️ General channel not found or not text-based");
            // }
        }


        //console.log(`⭐ ${username} (${userId}) now has ${totalPoints} points (Level ${newLevel})`);
    } catch (err) {
        //console.error("❌ Error updating user points:", err);
    }
});
async function postNewPRsAndIssues_batch() {
    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error("Bot is not in any guild!");
        return;
    }

    for (const repo of Object.keys(REPO_CHANNELS)) {
        const { prs, issues } = await fetchPRsAndIssues(repo);

        const repoChannelName = REPO_CHANNELS[repo];
        const repoChannel = guild.channels.cache.find(
            ch => ch.name === repoChannelName && ch.isTextBased()
        );

        if (!repoChannel) {
            console.log(`⚠️ Repo channel ${repoChannelName} not found, skipping.`);
            continue;
        }

        // Get previously posted data
        const dbData = await postedM.findOne({ repo }) || { prs: [], issues: [] };

        // Identify new PRs and Issues
        const newPRs = prs.filter(pr => !dbData.prs.includes(pr.html_url));
        const newIssues = issues.filter(issue => !dbData.issues.includes(issue.html_url));

        // === Batch Embed for PRs ===
        if (newPRs.length > 0) {
            const prList = newPRs.map(pr => 
                `• [${pr.title}](${pr.html_url}) by [${pr.user.login}](${pr.user.html_url})`
            ).join('\n');

            const prEmbed = new EmbedBuilder()
                .setTitle(`🔹 New Pull Requests for ${repo}`)
                .setDescription(prList.slice(0, 4000) || "No new pull requests this week.")
                .setColor(0x3498DB)
                .setTimestamp(new Date());

            await repoChannel.send({ embeds: [prEmbed] });
        }

        // === Batch Embed for Issues ===
        if (newIssues.length > 0) {
            const issueList = newIssues.map(issue => 
                `• [${issue.title}](${issue.html_url}) by [${issue.user.login}](${issue.user.html_url})`
            ).join('\n');

            const issueEmbed = new EmbedBuilder()
                .setTitle(`📝 New Issues for ${repo}`)
                .setDescription(issueList.slice(0, 4000) || "No new issues this week.")
                .setColor(0xE67E22)
                .setTimestamp(new Date());

            await repoChannel.send({ embeds: [issueEmbed] });

            // Optional: Highlight “good first issues” in the general channel
            const goodFirstIssues = newIssues.filter(issue =>
                issue.labels?.some(label => label.name.toLowerCase() === "good first issue")
            );

            if (goodFirstIssues.length > 0) {
                const generalChannel = guild.channels.cache.find(
                    ch => ch.name === GENERAL_CHANNEL_NAME && ch.isTextBased()
                );
                if (generalChannel) {
                    const gfiList = goodFirstIssues.map(issue => 
                        `• [${issue.title}](${issue.html_url}) by [${issue.user.login}](${issue.user.html_url})`
                    ).join('\n');

                    const gfiEmbed = new EmbedBuilder()
                        .setTitle(`🟢 Good First Issues in ${repo}`)
                        .setDescription(gfiList.slice(0, 4000))
                        .setColor(0x2ECC71)
                        .setTimestamp(new Date());

                    await generalChannel.send({ embeds: [gfiEmbed] });
                }
            }
        }

        // === Update DB state ===
        await postedM.updateOne(
            { repo },
            { $set: { prs: prs.map(p => p.html_url), issues: issues.map(i => i.html_url) } },
            { upsert: true }
        );
    }

    console.log("✅ Weekly batch posting complete.");
}

// ---------------------- POST PRs & ISSUES ----------------------
async function postNewPRsAndIssues() {
    const guild = client.guilds.cache.first();
    if (!guild) {
        console.error("Bot is not in any guild!");
        return;
    }

    let openPRs = [];
    let openIssues = [];

    for (const repo of Object.keys(REPO_CHANNELS)) {
        const { prs, issues } = await fetchPRsAndIssues(repo);

        openPRs.push(...prs.map(pr => pr.html_url));
        openIssues.push(...issues.map(issue => issue.html_url));

        const repoChannelName = REPO_CHANNELS[repo];
        const repoChannel = guild.channels.cache.find(ch => ch.name === repoChannelName && ch.isTextBased());

        if (!repoChannel) {
        //    console.log(`⚠️ Repo channel ${repoChannelName} not found, skipping.`);
            continue;
        }

        // Load DB data
        const dbData = await postedM.findOne({ repo }) || { prs: [], issues: [] };

        // --- New PRs ---
        const newPRs = prs.filter(pr => !dbData.prs.includes(pr.html_url));
        for (const pr of newPRs.slice(0, 5)) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: pr.user.login, iconURL: pr.user.avatar_url, url: pr.user.html_url })
                .setTitle(`🔹 ${pr.title}`)
                .setURL(pr.html_url)
                .setDescription(
                    `**Repository:** ${repo}\n` +
                    `**Status:** ${pr.draft ? "🚧 Draft" : pr.state === "open" ? "🟢 Open" : "✅ Closed"}\n\n` +
                    `${pr.body ? pr.body.slice(0, 300) + (pr.body.length > 300 ? "..." : "") : "No description"}`
                )
                .setColor(0x3498DB)
                .setFooter({ text: `PR #${pr.number} | Created at` })
                .setTimestamp(new Date(pr.created_at));

            await repoChannel.send({ embeds: [embed] });

            
        }

        // --- New Issues ---
        const newIssues = issues.filter(issue => !dbData.issues.includes(issue.html_url));
        for (const issue of newIssues.slice(0, 5)) {
            const labels = issue.labels?.length
                ? issue.labels.map(label => `\`${label.name}\``).join(", ")
                : "None";

            const detailedEmbed = new EmbedBuilder()
                .setAuthor({ name: issue.user.login, iconURL: issue.user.avatar_url, url: issue.user.html_url })
                .setTitle(`📝 Issue: ${issue.title}`)
                .setURL(issue.html_url)
                .setDescription(
                    `**Repository:** ${repo}\n` +
                    `**Labels:** ${labels}\n\n` +
                    `**Description:**\n${issue.body || "No description provided."}`
                )
                .setColor(0xE67E22)
                .setFooter({ text: `Issue #${issue.number} | Created at` })
                .setTimestamp(new Date(issue.created_at));

            await repoChannel.send({ embeds: [detailedEmbed] });

         
            // Extra: Good first issues → post in general
            if (issue.labels?.some(label => label.name.toLowerCase() === "good first issue")) {
                const generalChannel = guild.channels.cache.find(ch => ch.name === GENERAL_CHANNEL_NAME && ch.isTextBased());
                if (generalChannel) {
                    const briefEmbed = new EmbedBuilder()
                        .setTitle(`🟢 Good First Issue: ${issue.title}`)
                        .setURL(issue.html_url)
                        .setDescription(`**Repository:** ${repo}\n**Author:** ${issue.user.login}`)
                        .setColor(0x2ECC71);

                    await generalChannel.send({ embeds: [briefEmbed] });
                }
            }
        }

        // --- Update DB (replace old with new state) ---
        await postedM.updateOne(
            { repo },
            { $set: { prs: openPRs, issues: openIssues } },
            { upsert: true }
        );
    }
}

// ---------------------- BOT START ----------------------
setInterval(() => {
    postNewPRsAndIssues().catch(console.error);
}, FETCH_INTERVAL);

client.on('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await initDB();
    postNewPRsAndIssues_batch();
});

client.login(process.env.TOKEN);
