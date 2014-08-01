/*********************************************************
*  Copyright (c) 2013-2014 Donkil. All rights reserved.  *
*                                                        *
*           Publish under GPL License.                   *
*********************************************************/
var gui = require('nw.gui');
var tabStatus = new Array();
var qtabStatus = new Array();
var mainWindowId;
var popupCmd = 'xlogin';
var logining = false;
var soundQun = new Object;
var newMsg = new Object;
newMsg.friend = new Array;
newMsg.qun = new Array;
newMsg.msg = new Array;
var windowShakeCount;
var windowShake;
var notification = new Array;
var notiUin = new Array;
var msgId = 0;
var notiList = new Array;
var errors = "Errors:\n\n";
var errorsId = 0;
var padding = new Array;
var paddingSeek = new Array;
var accounts = new Array;
var outOfDate = false;
var qunnums = new Array;

if(!localStorage.widthoffset || !localStorage.heightoffset){
	getWindowBorder();
}

if(!localStorage.logout && localStorage.autoLogin && localStorage.account && localStorage.password){
	localStorage.autoShow = 'true';
	chrome.extension.sendMessage('login;'+encodeURIComponent(localStorage.account)+';'+encodeURIComponent(localStorage.password)+';'+encodeURIComponent(localStorage.state));
}

localStorage.logout = '';

chrome.extension.addListener(function(request, sender, callback) {
   if(request == 'lgstatus'){
		callback(popupCmd == 'showmain' ? 'on' : 'off');
	}
	else if(request == 'tabstatus'){
		callback(tabStatus);
	}
	else if(request == 'cancel'){
		setTimeout(function(){HTML5QQ.logout();}, 500);
	}
	else if(request == 'logout'){
		localStorage.logout = 'true';
		setTimeout(function(){HTML5QQ.logout();}, 500);
	}
	else if(request == 'newmsg'){
		callback(newMsg);
	}
	else if(request == 'showlog'){
		var logwin = window.open('about:blank', '_blank');
		logwin.document.write('<h2>如果您遇到问题，请将下列日志附带您的问题一同发送给开发者。</h2>');
		logwin.document.write('<p>请注意，下列日志包含您的如下隐私：</p>');
		logwin.document.write('<ul><li>QQ号码</li><li>QQ登录密码加密后的暗码</li><li>好友QQ号码</li><li>最近联系人QQ号码</li><li>好友分组</li><li>QQ群</li></ul>');
		logwin.document.write('<p>请注意，下列日志不会包含您的如下隐私：</p>');
		logwin.document.write('<ul><li>QQ登录密码明码</li><li>消息历史（聊天记录）</li></ul>');
		logwin.document.write('<textarea onclick="this.select()" style="width: 80%; height: 400px;">'+errors+'------------------'+debugLog+'</textarea>');
	}
	else if(typeof(request) == 'string' && request.substr(0, 5) == 'getqq'){
		var uin = request.substr(5);
		if(accounts[uin]){
			return;
		}
		HTML5QQ.getAccount(uin, function(qq){
			accounts[uin] = qq;
		});
	}
	else if(typeof(request) == 'string' && request.substr(0, 6) == 'uin2qq'){
		var uin = request.substr(6);
		if(accounts[uin]){
			callback(accounts[uin]);
		}
		else{
			chrome.extension.sendMessage('getqq'+uin);
			callback('waiting');
		}
	}
	else if(typeof(request) == 'string' && request.substr(0, 4) == 'otab'){
		var uin = request.substr(4);
		var fd = 0;
		for(var i = 0; i < tabStatus.length; i++){
			if(tabStatus[i][0] == uin){
				fd = 1;
				try{
					tabStatus[i][1].focus();
				}
				catch(e){
					fd = 0;
				}
				break;
			}
		}
		if(!fd){
			spliceNewMsg(uin, 'friend');
			var win = gui.Window.open('chat.html?'+uin, {
				"icon": "app/favicon.png",
    "toolbar": false,
               position: 'center',
               width: 500+parseInt(localStorage.widthoffset),
			   height: 520+parseInt(localStorage.heightoffset),
			   x: window.screen.width/2-250,
				y: window.screen.height/2-230,
            });
            tabStatus.push([uin, win]);
		}
	}
	else if(typeof(request) == 'string' && request.substr(0, 4) == 'ftab'){
		var uin = request.substr(4);
		uin = uin.split('|');
		var fd = 0;
		for(var i = 0; i < tabStatus.length; i++){
			if(tabStatus[i][0] == uin[0]){
				fd = 1;
				break;
			}
		}
		if(!fd){
			//tabStatus.push([uin[0], Number(uin[1])]);
		}
		callback(newMsg.msg);
		for(var i = 0; i < newMsg.msg.length; i++){
			if((newMsg.msg[i].type == 'friend' || newMsg.msg[i].type == 'file') && newMsg.msg[i].rec_uin == uin[0]){
				newMsg.msg.splice(i, 1);
				i--;
			}
		}
	}
	else if(typeof(request) == 'string' && request.substr(0, 4) == 'ctab'){
		var uin = request.substr(4);
		for(var i = 0; i < tabStatus.length; i++){
			if(tabStatus[i][0] == uin){
				tabStatus.splice(i, 1);
				break;
			}
		}
	}
	else if(typeof(request) == 'string' && request.substr(0, 4) == 'obot'){
		
	}
	else if(typeof(request) == 'string' && request.substr(0, 5) == 'oqtab'){
		var uin = request.substr(5);
		var fd = 0;
		for(var i = 0; i < qtabStatus.length; i++){
			if(qtabStatus[i][0] == uin){
				fd = 1;
				try{
					qtabStatus[i][1].focus();
				}
				catch(e){
					fd = 0;
				}
				break;
			}
		}
		if(!fd){
			soundQun[uin] = true;
			spliceNewMsg(uin, 'qun');
			var win = gui.Window.open('qun.html?'+uin, {
				"icon": "app/favicon.png",
                "toolbar": false,
               width: 500+parseInt(localStorage.widthoffset),
			   height: 520+parseInt(localStorage.heightoffset),
			   x: window.screen.width/2-250,
				y: window.screen.height/2-230,
            });
            qtabStatus.push([uin, win]);
		}
	}
	else if(typeof(request) == 'string' && request.substr(0, 5) == 'fqtab'){
		var uin = request.substr(5);
		uin = uin.split('|');
		var fd = 0;
		for(var i = 0; i < qtabStatus.length; i++){
			if(qtabStatus[i][0] == uin[0]){
				fd = 1;
				break;
			}
		}
		if(!fd){
			//qtabStatus.push([uin[0], Number(uin[1])]);
		}
		callback(newMsg.msg);
		for(var i = 0; i < newMsg.msg.length; i++){
			if(newMsg.msg[i].type == 'qun' && newMsg.msg[i].rec_uin == uin[0]){
				newMsg.msg.splice(i, 1);
				i--;
			}
		}
	}
	else if(typeof(request) == 'string' && request.substr(0, 5) == 'cqtab'){
		var uin = request.substr(5);
		soundQun[uin] = false;
		for(var i = 0; i < qtabStatus.length; i++){
			if(qtabStatus[i][0] == uin){
				qtabStatus.splice(i, 1);
				break;
			}
		}
	}
	else if(typeof(request) == 'string' && request.substr(0,5) == 'login'){
		logining = true;
	}
	else if(typeof(request) == 'string' && request.substr(0,5) == 'error'){
		errors += errorsId+"] "+request.substr(5)+"\n\n";
		errorsId++;
	}
	else if(typeof(request) == 'object'){
		switch(request.retcode){
			case 0:{
				for(var i = 0; i < request.result.length; i++){
					switch(request.result[i].poll_type){
						case 'message':{
							saveMsg(request.result[i].value, 'friend');
							break;
						}
						case 'group_message':{
							saveMsg(request.result[i].value, 'qun');
							break;
						}
						case 'file_message':{
							var t = new Date();
							var now = t.getTime();
							var url = 'http://d.web2.qq.com/channel/get_file2?lcid='+request.result[i].value.session_id+'&guid='+request.result[i].value.name+'&to='+request.result[i].value.from_uin+'&psessionid='+HTML5QQ.psessionid+'&count=1&time='+now+'&clientid='+HTML5QQ.clientid;
							request.result[i].value.url = url;
							saveMsg(request.result[i].value, 'file');
							break;
						}
						case 'push_offfile':{
							var url = 'http://'+request.result[i].value.ip+':'+request.result[i].value.port+'/'+request.result[i].value.name+'?ver=2173&rkey='+request.result[i].value.rkey+'&range=0';
							request.result[i].value.url = url;
							saveMsg(request.result[i].value, 'file');
							break;
						}
						case 'shake_message':{
							if(HTML5QQ.status == 'silent' || localStorage.unshake){
								break;
							}
							var uin = request.result[i].value.from_uin;
							var fd = 0;
							for(var i = 0; i < tabStatus.length; i++){
								if(tabStatus[i][0] == uin){
									fd = 1;
									break;
								}
							}
							if(!fd){
								spliceNewMsg(uin, 'friend');
							}
							if(!localStorage.unsound){
								document.getElementById('shakeSound').play();
							}
							break;
						}
					}
				}
			}
		}
	}
});

function shakeWindow(o, w){
	var rad = Math.PI/180*(o%360);
	var xp = 3*Math.cos(-rad);
	var yp = 3*Math.sin(-rad);
	if(windowShakeCount >= 360*5){
		clearInterval(windowShake);
	}
}

var qunInfo = new Object;

function saveMsg(msg, type){
	if(type == 'friend'){
		//console.log(msg);
		var uin = msg.from_uin;
		chrome.extension.sendMessage('getqq'+uin);
		var fd = 0;
		for(var i = 0; i < tabStatus.length; i++){
			if(tabStatus[i][0] == uin){
				fd = 1;
				break;
			}
		}
		if(!fd){
			pushNewMsg(uin, 'friend');
			chrome.extension.sendMessage('shakeFriendHead'+uin);
		}
		var t = new Date();
		var now = t.getTime();
		if(uin in HTML5QQ.friendsInfo.friends){
			var friend = HTML5QQ.friendsInfo.friends[uin];
			var friendName = friend.markname;
			if(!friendName){
				friendName = friend.nick;
			}
		}
		
		if(HTML5QQ.status != 'silent'){
			if(!localStorage.unsound){
				document.getElementById('msgSound').play();
			}
			notiList.push(msgId);
			if(isNaN(uin)){
				notification[msgId] = webkitNotifications.createNotification(
					'/images/bot/'+uin+'.png',
					uin,
					decodeMsg(msg.content)
				);
			}
			else{
				notification[msgId] = webkitNotifications.createNotification(
					'http://face'+Math.ceil(Math.random()*10)+'.qun.qq.com/cgi/svr/face/getface?cache=0&type=1&fid=0&uin='+uin+'&vfwebqq='+HTML5QQ.vfwebqq,
					friendName,
					decodeMsg(msg.content)
				);
			}
			notification[msgId].uin = uin;
			notification.msgId = msgId;
			notification[msgId].show();
			notification[msgId].onclick = function(){
				this.cancel();
				notiListSplice(this.msgId);
				chrome.extension.sendMessage('otab'+this.uin);
			};
			setTimeout(function(){notiListSplice()}, 5000);
			msgId++;
		}
		setTimeout(function(){
			var obj=getLocalStorageObj('history');
				if(!obj.history){
					history = new Object;
				}
				else{
					history = obj.history;
				}
				if(!history[HTML5QQ.qq]){
					history[HTML5QQ.qq] = new Object;
				}
				if(!history[HTML5QQ.qq]['friend']){
					history[HTML5QQ.qq]['friend'] = new Object;
				}
				if(!history[HTML5QQ.qq]['friend'][accounts[uin]]){
					history[HTML5QQ.qq]['friend'][accounts[uin]] = new Array;
				}
				history[HTML5QQ.qq]['friend'][accounts[uin]].push({time: now, uin: uin, name: friendName, msg: msg});
				if(!fd){
					newMsg.msg.push({type: 'friend', rec_uin: uin, time: now, uin: uin, name: friendName, msg: msg});
				}
				saveLocalStorageObj('history', history);

		}, 1000);
		padding[uin] = true;
		if(paddingSeek[uin]){
			clearTimeout(paddingSeek[uin]);
		}
		paddingSeek[uin] = setTimeout(function(){padding[uin]=false;},1500);
		setTimeout(function(){
			if(localStorage.autoopen && !padding[uin]){
				chrome.extension.sendMessage('otab'+uin);
		}},2000);
	}
	else if(type == 'qun'){
		var fd = 0;
		for(var i = 0; i < qtabStatus.length; i++){
			if(qtabStatus[i][0] == msg.group_code){
				fd = 1;
				break;
			}
		}
		if(!fd  && !localStorage.qunsilent){
			isQunSilent(msg.group_code, function(silent){
				if(!silent){
					pushNewMsg(msg.group_code, 'qun');
					chrome.extension.sendMessage('shakeQunHead'+msg.group_code);
				}
			});
		}
		if(!qunInfo[msg.group_code]){
			if(!soundQun[msg.group_code]){
				if(HTML5QQ.status != 'silent' && !localStorage.unsound && !localStorage.qunsilent){
					isQunSilent(msg.group_code, function(silent){
						if(!silent){
							document.getElementById('msgSound').play();
						}
					});
				}
				soundQun[msg.group_code] = true;
			}
			console.log(msg);
			// var t = new Date();
			// var now = t.getTime();
			var now = msg.time*1000;
			var url = 'http://s.web2.qq.com/api/get_group_info_ext2?gcode='+msg.group_code+'&vfwebqq='+HTML5QQ.vfwebqq+'&t='+now;
			HTML5QQ.httpRequest('GET', url, null, false, function(result){
				result = JSON.parse(result);
				qunInfo[msg.group_code] = result.result;
				var friendName;
				for(var i = 0; i < qunInfo[msg.group_code].minfo.length; i++){
					if(qunInfo[msg.group_code].minfo[i].uin == msg.send_uin){
						friendName = qunInfo[msg.group_code].minfo[i].nick;
						break;
					}
				}
				var obj=getLocalStorageObj('history');
					if(!obj.history){
						history = new Object;
					}
					else{
						history = obj.history;
					}
					if(!history[HTML5QQ.qq]){
						history[HTML5QQ.qq] = new Object;
					}
					if(!history[HTML5QQ.qq]['qun']){
						history[HTML5QQ.qq]['qun'] = new Object;
					}
					if(!history[HTML5QQ.qq]['qun'][msg.group_code]){
						history[HTML5QQ.qq]['qun'][msg.group_code] = new Array;
					}
					history[HTML5QQ.qq]['qun'][msg.group_code].push({time: now, uin: msg.send_uin, name: friendName, msg: msg});
					if(!fd){
						newMsg.msg.push({type: 'qun', rec_uin: msg.group_code, time: now, uin: msg.send_uin, name: friendName, msg: msg});
					}
					saveLocalStorageObj('history',history);
			});
		}
		else{
			if(!soundQun[msg.group_code]){
				if(HTML5QQ.status != 'silent' && !localStorage.unsound && !localStorage.qunsilent){
					isQunSilent(msg.group_code, function(silent){
						if(!silent){
							document.getElementById('msgSound').play();
						}
					});
				}
				soundQun[msg.group_code] = true;
			}
			var t = new Date();
			var now = t.getTime();
			var friendName;
			for(var i = 0; i < qunInfo[msg.group_code].minfo.length; i++){
				if(qunInfo[msg.group_code].minfo[i].uin == msg.send_uin){
					friendName = qunInfo[msg.group_code].minfo[i].nick;
					break;
				}
			}
			var obj=getLocalStorageObj('history');
				if(!obj.history){
					history = new Object;
				}
				else{
					history = obj.history;
				}
				if(!history[HTML5QQ.qq]){
					history[HTML5QQ.qq] = new Object;
				}
				if(!history[HTML5QQ.qq]['qun']){
					history[HTML5QQ.qq]['qun'] = new Object;
				}
				if(!history[HTML5QQ.qq]['qun'][msg.group_code]){
					history[HTML5QQ.qq]['qun'][msg.group_code] = new Array;
				}
				history[HTML5QQ.qq]['qun'][msg.group_code].push({time: now, uin: msg.send_uin, name: friendName, msg: msg});
				if(!fd){
					newMsg.msg.push({type: 'qun', rec_uin: msg.group_code, time: now, uin: msg.send_uin, name: friendName, msg: msg});
				}
				saveLocalStorageObj('history',history);

		}
	}
	else if(type == 'file'){
		var t = new Date();
		var now = t.getTime();
		if(HTML5QQ.status != 'silent' && !localStorage.unsound){
			document.getElementById('msgSound').play();
		}
		var uin = msg.from_uin;
		var fd = 0;
		for(var i = 0; i < tabStatus.length; i++){
			if(tabStatus[i][0] == uin){
				fd = 1;
				break;
			}
		}
		if(!fd){
			pushNewMsg(uin, 'friend');
			chrome.extension.sendMessage('shakeFriendHead'+uin);
		}
		var t = new Date();
		var now = t.getTime();
		if(uin in HTML5QQ.friendsInfo.friends){
			var friend = HTML5QQ.friendsInfo.friends[uin];
			var friendName = friend.markname;
			if(!friendName){
				friendName = friend.nick;
			}
		}
		newMsg.msg.push({type: 'file', rec_uin: uin, time: now, uin: uin, name: friendName, msg: msg});
	}
}

function notiListSplice(msgId){
	if(notiList.length == 0){
		return;
	}
	else if(!msgId){
		notification[notiList[0]].cancel();
		notiList.splice(0, 1);
	}
	else{
		for(var i=0; i<notiList.length; i++){
			if(notiList[i]==msgId){
				notiList.splice(i, 1);
				break;
			}
		}
	}
}

function decodeMsg(msg){
	if(typeof(msg) == 'string'){
		msg = JSON.parse(msg);
	}
	message = '';
	for(var i = 0; i < msg.length; i++){
		if(typeof(msg[i]) == 'string'){
			message += msg[i].replace(/\n/g, ' ').replace(/\r/g, ' ');
		}
		else if(typeof(msg[i]) == 'object'){
			switch(msg[i][0]){
				case 'face':{
					message += ' [图] ';
					break;
				}
				case 'offpic':{
					message += ' [图] ';
					break;
				}
			}
		}
	}
	if(message.length > 50){
		message = message.substr(0, 50)+'...';
	}
	return message;
}

function pushNewMsg(uin, type){
	if(type == 'friend'){
		var fd = 0;
		for(var i = 0; i < newMsg.friend.length; i++){
			if(newMsg.friend[i] == uin){
				fd = 1;
				break;
			}
		}
		if(!fd){
			newMsg.friend.push(uin);
		}
	}
	else if(type == 'qun'){
		var fd = 0;
		for(var i = 0; i < newMsg.qun.length; i++){
			if(newMsg.qun[i] == uin){
				fd = 1;
				break;
			}
		}
		if(!fd){
			newMsg.qun.push(uin);
		}
	}
	var msgNum = newMsg.friend.length + newMsg.qun.length;
	if(msgNum == 0){

	}
	else{

	}
}

function spliceNewMsg(uin, type){
	if(type == 'friend'){
		for(var i = 0; i < newMsg.friend.length; i++){
			if(newMsg.friend[i] == uin){
				newMsg.friend.splice(i, 1);
				break;
			}
		}
	}
	else{
		for(var i = 0; i < newMsg.qun.length; i++){
			if(newMsg.qun[i] == uin){
				newMsg.qun.splice(i, 1);
				break;
			}
		}
	}
	var msgNum = newMsg.friend.length + newMsg.qun.length;
	if(msgNum == 0){
		
	}
	else{
	}
}

function getRequest(url, callback){
	HTML5QQ.httpRequest('GET', url, null, false, callback, 5000);
}

function isQunSilent(code, callback){
	if(qunnums[code]){
		getQunStatus(qunnums[code], function(silent){
			callback(silent);
		});
		return;
	}
	var t = new Date;
	var now = t.getTime();
	var url = 'http://s.web2.qq.com/api/get_friend_uin2?tuin='+code+'&verifysession=&type=4&code=&vfwebqq='+HTML5QQ.vfwebqq+'&t='+now;
	HTML5QQ.httpRequest('GET', url, null, false, function(result){
		result = JSON.parse(result);
		if(result.result){
			qunnums[code] = result.result.account;
			getQunStatus(qunnums[code], function(silent){
				callback(silent);
			});
		}
	});
}

function getQunStatus(qunnum, callback){
	var obj=getLocalStorageObj('qunstatus');
		var qunstatus;
		if(!obj.qunstatus){
			qunstatus = new Object;
		}
		else{
			qunstatus = obj.qunstatus;
		}
		if(!qunstatus[HTML5QQ.qq]){
			qunstatus[HTML5QQ.qq] = new Array;
		}
		for(var i=0; i<qunstatus[HTML5QQ.qq].length; i++){
			if(qunstatus[HTML5QQ.qq][i] == qunnum){
				callback(true);
				return;
			}
		}
		callback(false);
		return;

}

function getWindowBorder(){
	var win = gui.Window.open('checkwindowsize.html', {
		"icon": "app/favicon.png",
    "toolbar": false,
		       height: 150,
		       width: 150,
			   x: 0,
			   y: 0,
            });
}