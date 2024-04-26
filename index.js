const { Client, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
const express = require("express");
const app = express();

app.listen(3000, () => {
  console.log("Project is running!");
});

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const newUrls = await convertAllUrls(message.content);

  if (newUrls.length === 0) return;

  await message.suppressEmbeds();
  let currentUrlBatch = [];

  for (const url of newUrls) {
    if (currentUrlBatch.length < 5) {
      currentUrlBatch.push(url);
    } else {
      const responseMessage = currentUrlBatch.join("\n");
      await message.reply(responseMessage, {
        allowedMentions: { repliedUser: false },
      });
      currentUrlBatch = [url];
    }
  }

  if (currentUrlBatch.length > 0) {
    const responseMessage = `${currentUrlBatch.join("\n")}`;
    await message.reply(responseMessage, {
      allowedMentions: { repliedUser: false },
    });
  }
});

async function convertAllUrls(messageContent) {
  const newUrls = [];
  const urlConversions = [
    {
      urlPattern: /https?:\/\/([\w\-]+\.)?tiktok\.com\/([^\s]*)/g,
      newDomain: "https://vxtiktok.com/",
    },
    {
      urlPattern: /https?:\/\/([\w\-]+\.)?instagram\.com\/([^\s]*)/g,
      newDomain: "https://ddinstagram.com/",
    },
    {
      urlPattern: /https?:\/\/([\w\-]+\.)?x\.com\/([^\s]*)/g,
      newDomain: "https://vxtwitter.com/",
    },
    {
      urlPattern: /https?:\/\/([\w\-]+\.)?twitter\.com\/([^\s]*)/g,
      newDomain: "https://vxtwitter.com/",
    },
  ];

  for (const urlConversion of urlConversions) {
    const convertedUrls = await convertUrl(
      messageContent,
      urlConversion.urlPattern,
      urlConversion.newDomain,
    );
    newUrls.push(...convertedUrls);
  }

  return newUrls;
}

async function getVideoUrl(messageContent) {
  try {
    const response = await fetch(messageContent, { redirect: "follow" });
    return response.url;
  } catch (error) {
    console.error("Error fetching TikTok video URL:", error);
  }
}

async function convertUrl(messageContent, urlPattern, newDomain) {
  const urls = messageContent.matchAll(urlPattern);
  const newUrls = [];

  for (const match of urls) {
    let [, subdomain, path] = match;
    const tiktokUrl = new URL(match);
    if (tiktokUrl.hostname.includes("tiktok")) {
      try {
        const newPath = await getVideoUrl(match[0]);
        if (newPath) {
          const urlAvecDomaine = newPath;
          const urlObjet = new URL(urlAvecDomaine);
          path = urlObjet.pathname + urlObjet.search + urlObjet.hash;
          if (path.startsWith("/")) {
            path = path.substring(1);
          }
          const newUrl = `${newDomain}${path}`;
          newUrls.push(newUrl);
        }
      } catch (error) {
        console.error("Error getting video URL:", error);
      }
    } else {
      const newUrl = `${newDomain}${path}`;
      newUrls.push(newUrl);
    }
  }
  return newUrls;
}

client.login(process.env.DISCORD_TOKEN);
