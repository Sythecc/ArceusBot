const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./badges.sqlite');
const badgeList = ["Fire", "Water", "Rock"];

client.on("ready", () => {
	// Check if the table "points" exists.
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
		if (message.member.roles.find(r => r.name === "Admin")) {
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
						badges = { id: `${message.guild.id}-${mentionedUser.id}`, user: mentionedUser.id, guild: message.guild.id, badge: badgeName }
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
		}
	}

	if (command == "removebadge") {
		if (message.member.roles.find(r => r.name === "Admin")) {
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
		}
	}
	if (command === "badges") {
		const badgesEmbed = new Discord.RichEmbed()
			.setColor('#FF0000')
			.setTitle(message.member.nickname + "'s Badges :")
			.setThumbnail(message.author.avatarURL)
			.setTimestamp()
			.setFooter('Created by Arceus#5253');
		//badgesString = "<@"+`${message.author.id}`+">s Badges :";
		//badgesString+="\n╔═══════════════════";
		badgesArray = badges.badge.split(" ");

		for (i = 0; i < badgesArray.length; i++) {
			switch (badgesArray[i]) {
				case ("None"):
					//badgesString+= "\n║\n╠No badges :sademote:";
					badgesEmbed.addField('No Badges', "sadness");
					break;
				case ("Fire"):
					//badgesString+= "\n║\n╠Fire badge :emote:";
					badgesEmbed.addField('Fire badge', "<:RowletFacepalm:670041359788408832>", true);
					break;
				case ("Water"):
					//badgesString+= "\n║\n╠Water badge :emote:";
					badgesEmbed.addField('Water badge', "<:RowletFacepalm:670041359788408832>", true);
					break;
				case ("Rock"):
					//badgesString+= "\n║\n╠Rock badge :emote:";
					badgesEmbed.addField('Rock badge', "<:RowletFacepalm:670041359788408832>", true);
					break;
			}
			if (i % 2) {
				badgesEmbed.addBlankField(true);
			}
		}
		//badgesString+="\n║\n╚═══════════════════"
		return message.channel.send(badgesEmbed);
	}
	if (command === "help") {
		const helpEmbeded = new Discord.RichEmbed()
			.setColor('#0099ff')
			.setTitle("Command List")
			.setThumbnail(client.avatarURL)
			.setTimestamp()
			.setFooter('Created by Arceus#5253')
			.addField("s!help","This menu!")
			.addField("s!gyminfo","Information about the gyms!")
			.addField("s![type]gym","Information on a particular gym!")
			.addField("s!badges","Shows you your badges!");
		//var helpList = 'here are the commands:\n**Normal Commands**' +
		//	'\ns!help - this menu' +
		//	'\ns!gyminfo - information about the gyms!' +
		//	'\ns![type]gym - info on a particular gym!' +
		//	'\ns!badges - Shows you your badges!';
		if (message.member.roles.find(r => r.name === "Admin")) {
		//	helpList += '\n**Admin Commands**' +
		//		'\n*s!givebadge @[person] [Typeofbadge]*' +
		//		'\n*s!removebadge @[person] [Typeofbadge]*';
			helpEmbeded.addField("**ADMIN COMMANDS**", "--------------------------")
			helpEmbeded.addField("s!givebadge @[person] [Typeofbadge]", "Use to add badges to challengers.")
			helpEmbeded.addField("s!removebadge @[person] [Typeofbadge]", "Use to revoke badges from challengers.")
		}
		return message.channel.send(helpEmbeded);
	}
	if (command === "gyminfo") {
		return message.channel.send('Fire Gym Leader : <@131233565303242752>' +
			'\nGym Leader : <@>' +
			'\nGym Leader : <@>' +
			'\nGym Leader : <@>' +
			'\nGym Leader : <@>' +
			'\nGym Leader : <@>' +
			'\nGym Leader : <@>' +
			'\nGym Leader : <@>' +
			'\nDo s![type]gym to have more info on that particular gym!');
	}
	if (command === "firegym") {
		return message.channel.send('Fire Gym Leader : <@131233565303242752>\n**BROOO THIS SOME SICK INFO** <:soslowpoke:669689130342416385>');
	}
});


client.login(config.token);