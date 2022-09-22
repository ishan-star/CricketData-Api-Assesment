import fetch from 'node-fetch';
import mongoose from 'mongoose';
import cron from 'node-cron';
import express from 'express';
import https from 'https';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.urlencoded({extended: true}))

//Fetching the upcoming matches from api and saving in database.
mongoose.connect("mongodb://localhost:27017/UCM", {useNewUrlParser: true, useFindAndModify: false,
UseUnifiedTopology:true});

const postSchema = new mongoose.Schema({
	data:[{
		id: String,
		name: String,
		matchType: String,
		status: String,
		venue: String,
		date: Date,
		dateTimeGMT: Date,
		teams: [String],
		teamInfo: [
		{
			name: String,
			shortname: String,
		}],
		score: [
			{
				r: Number,
				w: Number,
				o: Number,
				inning: String,
			}
		],
		seriesid : String,
		fantasyEnabled: Boolean,
		bbbEnabled: Boolean,
		hasSquad: Boolean,
}]


})

const Post = mongoose.model('Post',postSchema);


async function getPosts() {
	const myPosts = await fetch("https://api.cricapi.com/v1/matches?apikey=356e5244-8f17-416d-9d3a-f0c10ba395e0&offset=0");
	const response = myPosts.json();
	console.log(response);
	for(let i=0; i< response.length; i++)
	{
		const post = new Post({
			data:[{
			id: response[i]['id'],
			name: response[i]['name'],
			matchType: response[i]['matchType'],
			status: response[i]['status'],
			venue: response[i]['venue'],
			date: response[i]['date'],
			dateTimeGMT: response[i]['dateTimeGMT'],
			teams: response[i]['teams'],
			teamInfo: [
			{
				name: response[i]['name'],
				shortname: response[i]['shortname'],
				
			}],
			series_id: response[i]['series_id'],
			fantasyEnabled: response[i]['fantasyEnabled'],
			bbbEnabled: response[i]['bbbEnabled'],
			hasSquad: response[i]['hasSquad'],
		}],
		
	});
	post.save();
}
}
getPosts();



app.get("/",function(req,res){
 res.sendFile(__dirname+"/index.html");


//Adding a scheduler to update live score every 10 minutes.
async function updatePost()
{
	const updPosts = await fetch("https://api.cricapi.com/v1/currentMatches?apikey=356e5244-8f17-416d-9d3a-f0c10ba395e0&offset=0");
	const response = updPosts.json();
	for(let i=0; i< response.length; i++)
	{
		const identify = response[i][id];
		try{
			const result = await Post.updateOne({identify},{
			$set:{
								r: response[i]['r'],
								w: response[i]['w'],
								o: response[i]['o'],
								inning: response[i]['inning']
			}
		

		});
	}catch(err){
		console.log(err);
	}
	}
}


cron.schedule('0,10,20,30,40,50 * * * *',function(){
													updatePost();
				
				})



app.listen(3000,function(){
	console.log("Server is running on port 3000");
})
