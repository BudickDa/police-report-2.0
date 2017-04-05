import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import Crawler from 'crawly-mccrawlface';
import Cheerio from 'cheerio';

const Cache = new Mongo.Collection('cache');
const cache = {
	get: Meteor.bindEnvironment(function(key) {
		const doc = Cache.findOne({key: key});
		if (doc) {
			if (new Date().getTime() - doc.timestamp < 21600) {
				return doc.value;
			} else {
				Cache.remove(doc._id);
			}
		}
		return;
	}),
	set: Meteor.bindEnvironment(function(key, value) {
		Cache.upsert({key: key}, {value: value, timestamp: new Date().getTime()});
	})
}

const crawl = function() {
	return new Promise((resolve, reject) => {
		try{
			const c = new Crawler('http://www.polizei.bayern.de/news/presse/archiv/index.html?type=archiv&rubid=rub-4&period=fromto&periodto=04.04.2017&periodfrom=01.04.2010&periodselect=All&start=0', {
				readyIn: 5,
				goHaywire: false,
				userAgent: 'CrawlyMcCrawlface',
				expireDefault: 7 * 24 * 60 * 60 * 1000
			});
			c.addCache(cache);
			c.start();
			c.on('ready', resolve);
		}catch (e){
			reject(e);
		}
	});
}

Meteor.startup(async function() {
	const crawler = await crawl();
	crawler.stop();
	try{
		crawler.sites.forEach(site => {
			const $ = Cheerio.load(site.getContent());
			console.log($.html());
		});
	}catch(e){
		console.log(e);
	}
});

