const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./badges.sqlite');
const badgeList = ["Grass", "Bug", "Doublessandstorm", "Doublesfairy", "Fire", "Dragon", "Dark", "Ice"];

client.on("ready", () => {
	client.user.setPresence({ game: { name: 's!help to get started' }, status: 'available' });
	// Check if the table "badges" exists.
	const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'badges';").get();
	if (!table['count(*)']) {
		// If the table isn't there, create it and setup the database correctly.
		sql.prepare("CREATE TABLE badges (id TEXT PRIMARY KEY, user TEXT, guild TEXT, badge TEXT);").run();
		// Ensure that the "id" row is always unique and indexed.
		sql.prepare("CREATE UNIQUE INDEX idx_badges_id ON badges (id);").run();
		sql.pragma("synchronous = 1");
		sql.pragma("journal_mode = wal");
	}

	// And then we have two prepared statements to get and set the score data.
	client.getBadges = sql.prepare("SELECT * FROM badges WHERE user = ? AND guild = ?");
	client.setBadges = sql.prepare("INSERT OR REPLACE INTO badges (id, user, guild, badge) VALUES (@id, @user, @guild, @badge);");
});

client.on("message", message => {
	if (message.author.bot) return;
	let badges;
	if (message.guild) {
		badges = client.getBadges.get(message.author.id, message.guild.id);
		if (!badges) {
			badges = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, badge: "None" }
		}
		client.setBadges.run(badges);
	}
	if (message.content.indexOf(config.prefix) !== 0) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	// Commands
	if (command == "givebadge") {
		if (message.member.roles.find(r => r.name === "Admin" ||
			r.name === "Owner" || r.name === "Admin in Training")) {
			let badges;
			const mentionedUser = message.mentions.users.first();
			msgArray = message.content.split(" ");
			if (msgArray.length < 2 || message.mentions.users.size < 1 || !msgArray[2]) {
				message.channel.send("Wrong format, Try: ```s!givebadge @[person] [Typeofbadge]```");
			}
			else {
				badgeName = msgArray[2].substring(0, 1).toUpperCase() + msgArray[2].substring(1).toLowerCase();
				if (badgeList.includes(badgeName)) {
					previousBadges = client.getBadges.get(mentionedUser.id, message.guild.id);
					if (`${previousBadges.badge}` === "None") {
						badges = { id: `${message.guild.id}-${mentionedUser.id}`, user: mentionedUser.id, guild: message.guild.id, badge: `${badgeName}` }
						client.setBadges.run(badges);
						message.channel.send("Successfully added " + badgeName + " badge to <@" + mentionedUser.id + ">");
					} else {
						var newBadges = previousBadges.badge.split(" ");
						if (!newBadges.includes(badgeName)) {
							newBadges.push(badgeName);
							newBadges.sort();
							let newBadgesString = newBadges[0].toString();
							for (i = 1; i < newBadges.length; i++) {
								newBadgesString += " " + newBadges[i].toString();
							}
							badges = { id: `${message.guild.id}-${mentionedUser.id}`, user: mentionedUser.id, guild: message.guild.id, badge: `${newBadgesString}` }
							client.setBadges.run(badges);
							message.channel.send("Successfully added " + badgeName + " badge to <@" + mentionedUser.id + ">");
						} else {
							message.channel.send("<@" + mentionedUser.id + "> already has " + badgeName + " badge");
						}
					}
				} else {
					message.channel.send(badgeName + " is not the name of a badge");
				}
			}
		} else {
			message.channel.send("Only Admins can use this command.")
		}
	}

	if (command == "removebadge") {
		if (message.member.roles.find(r => r.name === "Admin" ||
			r.name === "Owner" || r.name === "Admin in Training")) {
			let badges;
			var newBadges = [];
			const mentionedUser = message.mentions.users.first();
			msgArray = message.content.split(" ");
			flag = false;
			if (msgArray.length < 2 || message.mentions.users.size < 1 || !msgArray[2]) {
				message.channel.send("Wrong format, Try: ```s!removebadge @[person] [Typeofbadge]```");
			} else {
				badgeName = msgArray[2].substring(0, 1).toUpperCase() + msgArray[2].substring(1).toLowerCase();
				if (badgeList.includes(badgeName)) {
					previousBadges = client.getBadges.get(mentionedUser.id, message.guild.id);
					var oldBadges = previousBadges.badge.split(" ");
					let newBadgesString = "";
					for (x = 0; x < oldBadges.length; x++) {
						if (oldBadges[x].toString() !== badgeName) {
							newBadgesString += oldBadges[x].toString() + " ";
						} else {
							flag = true;
						}
						if (!newBadgesString) {
							newBadgesString = "None";
						}
					}
					if (flag) {
						badges = { id: `${message.guild.id}-${mentionedUser.id}`, user: mentionedUser.id, guild: message.guild.id, badge: `${newBadgesString}` }
						client.setBadges.run(badges);
						message.channel.send("Successfully removed " + badgeName + " badge from <@" + mentionedUser.id + ">");
					} else {
						message.channel.send("<@" + mentionedUser.id + "> does not have " + badgeName + " badge");
					}
				} else {
					message.channel.send(badgeName + " is not the name of a badge");
				}
			}
		} else {
			message.channel.send("Only Admins can use this command.")
		}
	}
	if (command === "badges") {
		const badgesEmbed = new Discord.RichEmbed()
			.setColor('#FF0000')
			.setTitle(message.member.nickname + "'s Badges :")
			.setThumbnail(message.author.avatarURL)
			.setTimestamp()
			.setFooter('Created by Arceus#5253');
		badgesArray = badges.badge.split(" ");
		if(!message.member.nickname){
			badgesEmbed.setTitle(message.author.username+ "'s Badges :");
		}
		for (i = 0; i < badgesArray.length; i++) {
			//const badgeList = ["Grass", "Bug", "Doubles Sandstorm","Doubles Fairy", "Fire", "Dragon","Dark","Ice"];
			switch (badgesArray[i]) {
				case ("None"):
					badgesEmbed.addField('No Badges', "<:emptyBadge:683491161717211147>");
					break;
				case ("Grass"):
					badgesEmbed.addField('Grass badge', "<:emptyBadge:683491161717211147>", true);
					break;
				case ("Bug"):
					badgesEmbed.addField('Bug badge', "<:emptyBadge:683491161717211147>", true);
					break;
				case ("Doublessandstorm"):
					badgesEmbed.addField('Doubles Sandstorm badge', "<:emptyBadge:683491161717211147>", true);
					break;
				case ("Doublesfairy"):
					badgesEmbed.addField('Doubles Fairy badge', "<:emptyBadge:683491161717211147>", true);
					break;
				case ("Fire"):
					badgesEmbed.addField('Fire badge', "<:emptyBadge:683491161717211147>", true);
					break;
				case ("Dragon"):
					badgesEmbed.addField('Dragon badge', "<:emptyBadge:683491161717211147>", true);
					break;
				case ("Dark"):
					badgesEmbed.addField('Dark badge', "<:emptyBadge:683491161717211147>", true);
					break;
				case ("Ice"):
					badgesEmbed.addField('Ice badge', "<:emptyBadge:683491161717211147>", true);
					break;
			}
			if (i % 2) {
				badgesEmbed.addBlankField(true);
			}
		}
		return message.channel.send(badgesEmbed);
	}
	if (command === "help") {
		const helpEmbeded = new Discord.RichEmbed()
			.setColor('#0099ff')
			.setTitle("Command List")
			.setThumbnail(client.avatarURL)
			.setTimestamp()
			.setFooter('Created by Arceus#5253')
			.addField("s!help", "This menu!")
			.addField("s!gyminfo", "Information about the gyms!")
			.addField("s!badges", "Shows you your badges!");
		if (message.member.roles.find(r => r.name === "Admin" ||
			r.name === "Owner" || r.name === "Admin in Training")) {
			helpEmbeded.addField("**ADMIN COMMANDS**", "--------------------------")
			helpEmbeded.addField("s!givebadge @[person] [Typeofbadge]", "Use to add badges to challengers.")
			helpEmbeded.addField("s!removebadge @[person] [Typeofbadge]", "Use to revoke badges from challengers.")
		}
		return message.channel.send(helpEmbeded);
	}
	if (command === "gyminfo") {
		const gymInfoEmbeded = new Discord.RichEmbed()
			.setColor('#0099ff')
			.setTitle("Gym Leaders")
			.setThumbnail(client.avatarURL)
			.setTimestamp()
			.setFooter('Created by Arceus#5253')
			// CanaanTE#8564 the grass gym leader hasn’t responded to me
			.addField('**Grass Gym Leader :**', "<@!355022839730012161> Time(s) Available :\n*After school weekdays*\n*Friday 6pm CT\n*Midday Saturday*\nBadge : <:emptyBadge:683491161717211147>")
			// LordXbox420#4207 is bug 
			.addField('**Bug Gym Leader :**', "<@!419671144912650260> Time(s) Available :\n*Monday-Friday 4PM-8:30PM PST*\nBadge : <:emptyBadge:683491161717211147>")
			// just here#5407 is doubles sandstorm
			.addField('**Doubles Sandstorm Gym Leader :**', "<@!664187773955080203> Time(s) Available :\n*Monday after 3PM*\n*Tuesday after 6PM*\n*Thursday after 7PM*\n*Friday after 6:50PM*\n*Saturday after 4PM*\n*Sunday after 4PM*\nBadge : <:emptyBadge:683491161717211147>")
			// Skribblette:crescent_moon:#9523 is fairy 
			.addField('**Doubles Fairy Gym Leader :**', "<@!347952125315252225> Time(s) Available :\n*Friday after 7PM EST*\n*Saturday after 7PM EST*\nBadge : <:emptyBadge:683491161717211147>")
			// TheeMaxZee#4348 is fire 
			.addField('**Fire Gym Leader :**', "<@!503486299030945803> Time(s) Available :\n*Friday after 3PM EST*\nBadge : <:emptyBadge:683491161717211147>")
			// {Glitchfox}#4971 is dragon
			.addField('**Dragon Gym Leader :**', "<@!472568934621511691> Time(s) Available :\n*Tuesday and Saturday 1PM-9PM EST*\nBadge : <:emptyBadge:683491161717211147>")
			// Yujio#3923 is dark
			.addField('**Dark Gym Leader :**', "<@!435551482851622924> Time(s) Available :\n*Monday: 5:30-6:00PM EST*\n*Tuesday: 4:30- 5:30PM EST*\n*Wednesday: 5:30-6:00PM EST*\n*Thursday: 6:30-7:00PM EST*\n*Friday: 6:30-7:00PM EST*\n*Weekends: All day*\nBadge : <:emptyBadge:683491161717211147>")
			// freethoughtisalie#9132 is ice
			.addField('**Ice Gym Leader :**', "<@!531698462643716106> Time(s) Available :\n*Monday-Wednesday after 10PM EST*\nBadge : <:emptyBadge:683491161717211147>");
		return message.channel.send(gymInfoEmbeded);
	}
});
client.login(config.token);