/* app通用设置 start */
var server = 'http://192.168.124.18:8980/plant/front/plant/'; //本地服务器地址
// var server = 'http://111.229.231.227:8980/plant/front/plant/'; //测试环境服务器地址

//var timestamp = new Date().getTime(); //参数：时间戳
var network = true; //网络


//判断网络连接
if(mui.os.plus) {
	mui.plusReady(function() {
		//初始化判断网络状态
		if(plus.networkinfo.getCurrentType() == plus.networkinfo.CONNECTION_NONE) {
			network = false;
		}
		document.addEventListener('netchange', function() {
			var nt = plus.networkinfo.getCurrentType();
			switch(nt) {　　　　
				case plus.networkinfo.CONNECTION_ETHERNET:
					　　　　
				case plus.networkinfo.CONNECTION_WIFI:
					network = true;　　　　　　
					break;　　　
				case plus.networkinfo.CONNECTION_CELL2G:
					　　　
				case plus.networkinfo.CONNECTION_CELL3G:
					　　　　
				case plus.networkinfo.CONNECTION_CELL4G:
					network = true;　　　　　　
					break;　　　　
				default:
					network = false;　　　　　　
					break;　　
			}
		}, false);
	});
}

//设置全局beforeSend
$.ajaxSettings.beforeSend = function(xhr, setting) {
	//beforeSend演示,也可在$.ajax({beforeSend:function(){}})中设置单个Ajax的beforeSend
	console.log('beforeSend:::' + JSON.stringify(setting));
};
//设置全局complete
$.ajaxSettings.complete = function(xhr, status) {
	console.log('complete:::' + status);
}

/* app通用设置 end */


/* app通用方法 start */

//判断数字的处理方法(正的/整数或两位小数)
function checkNumber(num) {
	if(!/^\d+(\.\d{1,2})?$/.test(num)) {
		return false;
	} else {
		return true;
	}
}


/**
 * 数组根据数组对象中的某个属性值进行排序的方法
 * @param property 排序的属性
 * @param rev true表示升序排列，false降序排序，默认升序排列
 */
 function compare(property,rev){
	if(rev ==  undefined){
		rev = 1;
	}else{
		rev = (rev) ? 1 : -1;
	}
	
	return function(a,b){
		a = a[property];
		b = b[property];
		if(a < b){
			return rev * -1;
		}
		if(a > b){
			return rev * 1;
		}
		return 0;
	}
}
 function compareForNumber(property,rev){
	if(rev ==  undefined){
		rev = 1;
	}else{
		rev = (rev) ? 1 : -1;
	}
	
	return function(a,b){
		a = a[property];
		b = b[property];
		if(Number(a) < Number(b)){
			return rev * -1;
		}
		if(Number(a) > Number(b)){
			return rev * 1;
		}
		return 0;
	}
}

/**
 * 生成UUID
 */
function uuid() {
    var str= 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
	var reg = new RegExp("-", "g" );
	return str.replace(reg, "");
}

/**
 * 获取GPS信息
 */
function getGPS(){
	var promise = new Promise(function(resolve, reject) {
		let gps={};
		plus.geolocation.getCurrentPosition( function(position){
			gps.time = getFormatTime(position.timestamp);
			var codns = position.coords;
			gps.lat = codns.latitude;
			gps.lon = codns.longitude;
			resolve(gps);
		}, function ( e ) {
			reject(e.message);
			console.log( "获取位置信息失败："+e.message );
		}, {geocode:false} );
	});
	return promise;
}

/**
 * 拍照
 */
function getImage(){
	var promise = new Promise(function(resolve, reject) {
		var cmr = plus.camera.getCamera();
		cmr.captureImage(function(p){
			console.log(p);
			plus.io.resolveLocalFileSystemURL(p, function(entry){
				compressImage(entry.toLocalURL(),entry.name);
				resolve(entry.toLocalURL());
			}, function(e){
				console.log('读取拍照文件错误：'+e.message);
				reject(e);
			});
		}, function(e){
			console.log('失败：'+e.message);
			reject(e);
		}, {filename:'_doc/'+localStorage.getItem('loginName')+'/camera/',index:1});
	});
	return promise;
}

/**
 * 录像
 */
function getVideo(){
	var promise = new Promise(function(resolve, reject) {
		var cmr = plus.camera.getCamera();
		cmr.startVideoCapture(function(p){
			plus.io.resolveLocalFileSystemURL(p, function(entry){
				//compress(entry.toLocalURL(),entry.name);
				resolve(entry.toLocalURL());
			}, function(e){
				console.log('读取录像文件错误：'+e.message);
				reject(e);
			} );
		}, function(e){
			console.log('失败：'+e.message);
			reject(e);
		}, {filename:'_doc/'+localStorage.getItem('loginName')+'/camera/',index:1});
	});
	return promise;
}

// 压缩图片
function compressImage(src,name){
	plus.zip.compressImage({
		src:src,
		dst:"_doc/"+localStorage.getItem('loginName')+"/camera/"+name,
		quality:90,
		overwrite:true,
		width:'50%'
	},
	function(i){
		//console.log("压缩图片成功："+JSON.stringify(i));
		//return i.target;
	},function(e){
		//console.log("压缩图片失败: "+JSON.stringify(e));
	});
}

//压缩文件
function compress(file,name){
	console.log( "压缩文件：" );
	let zipfile="_doc/"+localStorage.getItem('loginName')+"/zip/"+name;
	plus.io.resolveLocalFileSystemURL( zipfile, function(entry){
		console.log( "文件已存在，中止操作！" );
		plus.nativeUI.confirm( "压缩文件已存在，是否立即删除", function(i){
			if ( i.index == 0 ) {
				entry.remove();
			}
		} );
	}, function(e){
		plus.zip.compress( file, zipfile, function(){
			console.log( "操作成功！保存路径为："+zipfile );
		}, function(e){
			console.log( "操作失败："+e.message );
		} );
	} );
}

/**
 * 获取待上传钻孔数据
 */
function uploadHole(projNo,holeNo){
	let tableNameList=["dky_layer_info","dky_return_info","dky_sample_info","dky_stage_info","dky_test_info","dky_media_info"];
	let projectID="";
	let dataList={};
	let promise = openDB();
	promise.then(function(){
		var promiseArray = [];
		promiseArray.push(selectSQL("dky_proj_info",'projNo="'+encrypt(projNo)+'"',"projNo").then(function(data){
			projectID=data[0].serialNumber;
		}));
		let sql='projNo="'+encrypt(projNo)+'" and holeNo="'+encrypt(holeNo)+'"';
		promiseArray.push(selectSQL("dky_hole_info",sql,"holeNo").then(function(data){
			dataList["hole"]=data;
		}));
		for (let table in tableNameList) {
			if(tableNameList[table]=="dky_media_info"){
				promiseArray.push(selectSQL(tableNameList[table],sql+' and isDelete="'+encrypt("0")+'" and type!="'+encrypt(2)+'"',"createTime").then(function(data){
					dataList["media"]=data;
				}));
			}else{
				let name=tableNameList[table].split('_')[1];
				promiseArray.push(selectSQL(tableNameList[table],sql,name+"No").then(function(data){
					dataList[name]=data;
				}));
			}
		}
		Promise.all(promiseArray).then(function() {
			closeDB();
			dealData(projectID,dataList);
		})
	});
}

/**
 * 待上传钻孔数据的处理方法
 */
function dealData(projectID,dataList){
	let map={"descriptorImage":false,"drillerImage":false,"rigImage":false,"sceneImage":false};
	for(let i=0;i<dataList["media"].length;i++){
		let media=dataList["media"][i];
		if(map.hasOwnProperty(media.kind)){
			map[media.kind]=true;
		}
		if(media.isUpload=="1"){
			dataList["media"].splice(i,1);
			i--;
		}
	}
	if(!map["descriptorImage"]){
		mui.toast('至少添加一张描述员照片');
		return;
	}else if(!map["drillerImage"]){
		mui.toast('至少添加一张司钻员照片');
		return;
	}else if(!map["rigImage"]){
		mui.toast('至少添加一张钻机照片');
		return;
	}else if(!map["sceneImage"]){
		mui.toast('至少添加一张场景照片');
		return;
	}
	let temHole=dataList["hole"][0];
	if(temHole.descriptorNo==""||temHole.descriptorNo==null || temHole.descriptorNo=="null"){
		mui.toast('没有填写描述员证书编号');
	}else if(temHole.drillerNo==""||temHole.drillerNo==null || temHole.drillerNo=="null"){
		mui.toast('没有填写司钻员证书编号');
	}
	
	//null处理
	for (let table in dataList) {
		if(dataList[table].length>0){
			dataList[table].filter(function(item) {
				for (let key in item) {
					if(item[key]=="null" || item[key]==null){
						item[key]="";
					}
				}
			});
		}
	}
	
	plus.nativeUI.showWaiting();
	//console.log(JSON.stringify(dataList));
	if(network){
		$.ajax({
			type: "POST",
			url: server + 'login',
			data: {
				uname: localStorage.getItem('loginName'),
				pwd: localStorage.getItem('loginPwd')
			},
			dataType: "json",
			success: function(data) {
				if (data.status == "200") {
					localStorage.setItem('tk', data.tk);
					
					//上传
					if(dataList["media"].length>0){
						var promise=ajax_uploadFiles(dataList["media"]);
						promise.then(function(result){
							for (let media of dataList.media) {
								for (let i in result){
									if(media.id==result[i].id){
										media.serverPath=result[i].serverPath;
										break;
									}
								}
							}
							dealDataForGov(projectID,dataList);
							delete dataList.media;
							ajax_uploadHoleToBack(dataList);
						},function(e){
							plus.nativeUI.closeWaiting();
							plus.nativeUI.alert("上传失败，请稍后重试…",null, "提示", "确定");
						});
					}else{
						dealDataForGov(projectID,dataList);
						delete dataList.media;
						ajax_uploadHoleToBack(dataList);
					}
				} else {
					plus.nativeUI.closeWaiting(); 
					console.log(data.code + data.msg);
					mui.toast(data.msg, {
						duration: "long"
					});
				}
			},
			error: function(error) {
				plus.nativeUI.closeWaiting(); 
				console.log(JSON.stringify(error));
			}
		});
	}else{
		mui.toast("当前网络不给力，请稍后再试",{duration:"long"});
	}
}

//构造政府数据结构
function dealDataForGov(projectID,dataList){
	if(projectID==""){
		return;
	}
	let hole=dataList.hole[0];
	var driller = "";
	openDB().then(function(){
		selectSQL('sys_user','name="'+encrypt(hole.driller)+'"').then(function(data){
			if(data.length>0){
				driller=data[0].ids;
			}
		})
		closeDB();
	})
	let holeEntity={
		projectID:projectID,
		code:hole.holeNo,
		createTime:hole.createTime,
		updateTime:hole.updateTime,
		type:2,//1-探井、2-钻孔
		depth:hole.holeDepth,
		longitude:hole.longitude,
		latitude:hole.latitude,
		mapLatitude:hole.latitude,
		mapLongitude:hole.longitude,
		mapTime:hole.locationTime,
		secretKey:secretKey,
		recordListStr:[
			{
				ids:uuid(),
				code:"holePer-01",
				type:"描述员",
				createTime:hole.updateTime,
				recordPerson:localStorage.getItem('ids'),
				longitude:hole.longitude,
				latitude:hole.latitude,
				gpsTime:hole.locationTime
			},
			{
				ids:uuid(),
				code:"holePer-02",
				type:"机长",
				createTime:hole.updateTime,
				recordPerson:localStorage.getItem('ids'),
				longitude:hole.longitude,
				latitude:hole.latitude,
				gpsTime:hole.locationTime,
				operatePerson:driller,
				testType:hole.drillerNo
			},
			{
				ids:uuid(),
				code:"holePer-03",
				type:"负责人",
				createTime:hole.updateTime,
				recordPerson:localStorage.getItem('ids'),
				longitude:hole.longitude,
				latitude:hole.latitude,
				gpsTime:hole.locationTime,
				operatePerson:""
			},
			{
				ids:uuid(),
				code:"holePer-04",
				type:"工程师",
				createTime:hole.updateTime,
				recordPerson:localStorage.getItem('ids'),
				longitude:hole.longitude,
				latitude:hole.latitude,
				gpsTime:hole.locationTime,
				operatePerson:""
			},
			{
				ids:uuid(),
				code:"holePer-05",
				type:"场景",
				createTime:hole.updateTime,
				recordPerson:localStorage.getItem('ids'),
				longitude:hole.longitude,
				latitude:hole.latitude,
				gpsTime:hole.locationTime
			},
			{
				ids:uuid(),
				code:"holePer-06",
				type:"钻机",
				createTime:hole.updateTime,
				recordPerson:localStorage.getItem('ids'),
				longitude:hole.longitude,
				latitude:hole.latitude,
				gpsTime:hole.locationTime,
				testType:hole.drillRigNo
			},
			{
				ids:uuid(),
				code:"holePer-07",
				type:"提钻录像",
				createTime:hole.updateTime,
				recordPerson:localStorage.getItem('ids'),
				longitude:hole.longitude,
				latitude:hole.latitude,
				gpsTime:hole.locationTime
			}
		]
	};
	for(let i=0;i<holeEntity.recordListStr.length;i++){
		holeEntity.recordListStr[i].mediaListStr=[];
		let typeStr=holeEntity.recordListStr[i].type;
		for(let item of dataList.media){
			if((item.kind=="descriptorImage" && typeStr=="描述员") || (item.kind=="drillerImage" && typeStr=="机长") || (item.kind=="projLeaderImage" && typeStr=="负责人") || (item.kind=="engineerImage" && typeStr=="工程师") || (item.kind=="sceneImage" && typeStr=="场景") || (item.kind=="rigImage" && typeStr=="钻机") || (item.kind=="drillVideo" && typeStr=="提钻录像")){
				let media={
					name:item.name,
					createTime:item.createTime,
					type:item.type,
					internetPath:item.serverPath,
					remark:item.remark,
					longitude:item.longitude,
					latitude:item.latitude,
					gpsTime:item.locationTime
				}
				holeEntity.recordListStr[i].mediaListStr.push(media);
			}
		}
		if(typeStr=="提钻录像" && holeEntity.recordListStr[i].mediaListStr.length==0){
			holeEntity.recordListStr.splice(i,1);
			i--;
		}
	}
	
	for (let item of dataList.return) {
		let entity={
			ids:item.id,
			code:item.returnNo,
			type:"回次",
			createTime:item.createTime,
			recordPerson:item.descriptor,
			description:item.drillAbnormalDesc,
			longitude:item.longitude,
			latitude:item.latitude,
			gpsTime:item.locationTime,
			isDelete:(item.delFlag=="1" || item.isHistory=="1")?true:false,
			frequencyType:item.drillMethod,
			frequencyMode:item.wallProtectMethod,
			aperture:item.boreDiameter,
			beginDepth:item.startDepth,
			endDepth:item.endDepth,
			mediaListStr:[]
		};
		for(let mediaEntity of dataList.media){
			if(mediaEntity.kind=="returnEntity" && mediaEntity.kindNo==entity.code && !entity.isDelete){
				let media={
					name:mediaEntity.name,
					createTime:mediaEntity.createTime,
					type:mediaEntity.type,
					internetPath:mediaEntity.serverPath,
					remark:mediaEntity.remark,
					longitude:mediaEntity.longitude,
					latitude:mediaEntity.latitude,
					gpsTime:mediaEntity.locationTime
				}
				entity.mediaListStr.push(media);
			}
		}
		holeEntity.recordListStr.push(entity);
	}
	for (let item of dataList.layer) {
		let entity={
			ids:item.id,
			code:item.layerNo,
			type:"岩土",
			createTime:item.createTime,
			recordPerson:item.descriptor,
			description:item.remarks,
			longitude:item.longitude,
			latitude:item.latitude,
			gpsTime:item.locationTime,
			isDelete:(item.delFlag=="1" || item.isHistory=="1")?true:false,
			layerType:item.rockType,
			layerName:item.rockName,
			causes:item.geologicalOrign,
			era:item.geologicalYear,
			beginDepth:item.topDepth,
			endDepth:item.bottomDepth,
			mediaListStr:[]
		};
		if(item.rockType=="填土"){
			entity["zycf"]=item.mainPart;
			entity["cycf"]=item.secondaryPart;
			entity["djnd"]=item.pileYears;
			entity["msd"]=item.density;
			entity["jyx"]=item.homogeneity;
		}else if(item.rockType=="黏性土"){
			entity["ys"]=item.colour;
			entity["zt"]=item.consistency;
			entity["bhw"]=item.including;
			entity["jc"]=item.interlayer;
		}else if(item.rockType=="粉土"){
			entity["ys"]=item.colour;
			entity["sd"]=item.humidity;
			entity["bhw"]=item.including;
			entity["msd"]=item.density;
			entity["jc"]=item.interlayer;
		}else if(item.rockType=="砂土"){
			entity["kwzc"]=item.mineralComp;
			entity["kljp"]=item.particalSizeDistribution;
			entity["klxz"]=item.particalShape;
			entity["sd"]=item.humidity;
			entity["ys"]=item.colour;
			entity["msd"]=item.density;
		}else if(item.rockType=="碎石土"){
			entity["ys"]=item.colour;
			entity["msd"]=item.density;
			entity["tcw"]=item.filling;
			entity["klxz"]=item.particalShape;
			entity["klpl"]=item.particalLine;
			entity["kljp"]=item.particalSizeDistribution;
			entity["ybljx"]=item.dNormalSmall;
			entity["ybljd"]=item.dNormalBig;
			//entity["jdljx"]="";
			//entity["jdljd"]="";
			entity["zdlj"]=item.dBig;
			entity["mycf"]=item.parentRockComp;
			entity["fhcd"]=item.rockDeoayRate;
			entity["sd"]=item.humidity;
			entity["jc"]=item.interlayer;
		}else if(item.rockType=="淤泥"){
			entity["ys"]=item.colour;
			entity["bhw"]=item.including;
			entity["zt"]=item.consistency;
			entity["hsl"]=item.waterContent;
		}else if(item.rockType=="沉积岩" || item.rockType=="岩浆岩" || item.rockType=="变质岩"){
			entity["layerType"]="岩石";
			entity["ys"]=item.colour;
			entity["jycd"]=item.hardness;
			entity["wzcd"]=item.integrity;
			entity["jbzldj"]=item.basicQualityLev;
			entity["kwx"]=item.diggability;
			entity["fhcd"]=item.rockDeoayRate;
			entity["jglx"]=item.diggability;
		}
		
		for(let mediaEntity of dataList.media){
			if(mediaEntity.kind=="layerEntity" && mediaEntity.kindNo==entity.code && !entity.isDelete){
				let media={
					name:mediaEntity.name,
					createTime:mediaEntity.createTime,
					type:mediaEntity.type,
					internetPath:mediaEntity.serverPath,
					remark:mediaEntity.remark,
					longitude:mediaEntity.longitude,
					latitude:mediaEntity.latitude,
					gpsTime:mediaEntity.locationTime
				}
				entity.mediaListStr.push(media);
			}
		}
		holeEntity.recordListStr.push(entity);
	}
	for (let item of dataList.sample) {
		let entity={
			ids:item.id,
			code:item.sampleNo,
			type:"取土",
			createTime:item.createTime,
			recordPerson:item.descriptor,
			description:item.remarks,
			longitude:item.longitude,
			latitude:item.latitude,
			gpsTime:item.locationTime,
			isDelete:(item.delFlag=="1" || item.isHistory=="1")?true:false,
			beginDepth:item.sampleStartDepth,
			endDepth:item.sampleEndDepth,
			earthType:item.qualityLevel,
			getMode:item.samplingTool,
			testType:"",//实验类型（岩石试验、土的物理性质试验 、土的压缩固结试验 、土的抗剪强度试验、土的动力性质试验）
			mediaListStr:[]
		};
		for(let mediaEntity of dataList.media){
			if(mediaEntity.kind=="sampleEntity" && mediaEntity.kindNo==entity.code && !entity.isDelete){
				let media={
					name:mediaEntity.name,
					createTime:mediaEntity.createTime,
					type:mediaEntity.type,
					internetPath:mediaEntity.serverPath,
					remark:mediaEntity.remark,
					longitude:mediaEntity.longitude,
					latitude:mediaEntity.latitude,
					gpsTime:mediaEntity.locationTime
				}
				entity.mediaListStr.push(media);
			}
		}
		holeEntity.recordListStr.push(entity);
	}
	for (let item of dataList.test) {
		let entity;
		if(item.testMethod=="标贯"){
			entity={
				ids:item.id,
				code:item.testNo,
				type:"标贯",
				createTime:item.createTime,
				recordPerson:item.descriptor,
				description:item.remarks,
				longitude:item.longitude,
				latitude:item.latitude,
				gpsTime:item.locationTime,
				isDelete:(item.delFlag=="1" || item.isHistory=="1")?true:false,
				drillLength:item.pipeLenth,
				begin1:item.expectDepthStart,
				end1:item.expectDepthEnd,
				blow1:item.expectHammerTimes,
				begin2:item.firstDepthStart,
				end2:item.firstDepthEnd,
				blow2:item.firstHammerTimes,
				begin3:item.secondDepthStart,
				end3:item.secondDepthEnd,
				blow3:item.secondHammerTimes,
				begin4:item.thirdDepthStart,
				end4:item.thirdDepthEnd,
				blow4:item.thirdHammerTimes,
				mediaListStr:[]
			};
		}else{
			entity={
				ids:item.id,
				code:item.testNo,
				type:"动探",
				createTime:item.createTime,
				recordPerson:item.descriptor,
				description:item.remarks,
				longitude:item.longitude,
				latitude:item.latitude,
				gpsTime:item.locationTime,
				isDelete:(item.delFlag=="1" || item.isHistory=="1")?true:false,
				powerType:item.testMethod,
				drillLength:item.pipeLenth,
				begin1:item.firstDepthStart,
				end1:item.firstDepthEnd,
				blow1:item.totalTimes,
				mediaListStr:[]
			};
		}
		for(let mediaEntity of dataList.media){
			if(mediaEntity.kind=="testEntity" && mediaEntity.kindNo==entity.code && !entity.isDelete){
				let media={
					name:mediaEntity.name,
					createTime:mediaEntity.createTime,
					type:mediaEntity.type,
					internetPath:mediaEntity.serverPath,
					remark:mediaEntity.remark,
					longitude:mediaEntity.longitude,
					latitude:mediaEntity.latitude,
					gpsTime:mediaEntity.locationTime
				}
				entity.mediaListStr.push(media);
			}
		}
		holeEntity.recordListStr.push(entity);
	}
	for (let item of dataList.stage) {
		let entity;
		if(item.ifFetchWater=="0"){
			entity={
				ids:item.id,
				code:item.stageNo,
				type:"水位",
				createTime:item.createTime,
				recordPerson:item.descriptor,
				description:item.remarks,
				longitude:item.longitude,
				latitude:item.latitude,
				gpsTime:item.locationTime,
				isDelete:(item.delFlag=="1" || item.isHistory=="1")?true:false,
				waterType:item.groundwater_type,
				shownWaterLevel:item.initialWaterLevel,
				stillWaterLevel:item.staticWaterLevel,
				shownTime:item.initialWaterTime,
				stillTime:item.staticWaterTime,
				mediaListStr:[]
			};
		}else{
			entity={
				ids:item.id,
				code:item.stageNo,
				type:"取水",
				createTime:item.createTime,
				recordPerson:item.descriptor,
				description:item.remarks,
				longitude:item.longitude,
				latitude:item.latitude,
				gpsTime:item.locationTime,
				isDelete:(item.delFlag=="1" || item.isHistory=="1")?true:false,
				waterDepth:item.waterIntakeDepth,
				getMode:item.waterIntakeWay,
				mediaListStr:[]
			};
		}
		for(let mediaEntity of dataList.media){
			if(mediaEntity.kind=="stageEntity" && mediaEntity.kindNo==entity.code && !entity.isDelete){
				let media={
					name:mediaEntity.name,
					createTime:mediaEntity.createTime,
					type:mediaEntity.type,
					internetPath:mediaEntity.serverPath,
					remark:mediaEntity.remark,
					longitude:mediaEntity.longitude,
					latitude:mediaEntity.latitude,
					gpsTime:mediaEntity.locationTime
				}
				entity.mediaListStr.push(media);
			}
		}
		holeEntity.recordListStr.push(entity);
	}
	
	console.log(JSON.stringify(holeEntity));
	ajax_uploadHoleToGov(holeEntity);
}

/**
 * 上传文件到企业平台
 */
function ajax_uploadFiles(files){
	var promise = new Promise(function(resolve, reject) {
		if(files.length<=0){
			return;
		}
		var task=plus.uploader.createUpload(server+"upload/uploadMultiFiles",
			{method:'POST'},
			function(t,status){
				if(status==200){
					console.log('上传成功：'+t.responseText);
					let result=JSON.parse(t.responseText);
					openDB().then(function(){
						var promiseArray = [];
						for (let i in result) {
							let item={
								serverPath:result[i].serverPath,
								isUpload:"1"
							};
							promiseArray.push(update("dky_media_info",item,result[i].id));
						}
						Promise.all(promiseArray).then(function() {
							closeDB();
							resolve(result);
						})
					});
				}else{
					console.log('上传失败：'+status);
					reject(status);
				}
			}
		);
		task.addData('data',JSON.stringify(files));
		task.addData('tk',localStorage.getItem("tk"));
		for(var i=0;i<files.length;i++){
			task.addFile(files[i].internetPath, {key:files[i].id});
		}
		task.start();		
	});
	return promise;
}

/**
 * 上传钻孔数据到企业平台
 */
function ajax_uploadHoleToBack(dataList){
	$.ajax({
		type: "POST",
		url: server + 'upload/Drill?tk='+localStorage.getItem('tk'),
		data: JSON.stringify(dataList),
		dataType: "json",
		contentType: 'application/json; charset=UTF-8',
		success: function(data) {
			console.log(JSON.stringify(data));
			plus.nativeUI.closeWaiting();
			if(data.status == "200"){
				plus.nativeUI.alert("上传企业平台成功",null, "提示", "确定");
				openDB().then(function(data){
					var promiseArray = [];
					for (let key in dataList) {
						if(key=="hole"){
							if(dataList[key][0].progress<"2"){
								promiseArray.push(updateFlag("dky_"+key+"_info","progress","2",dataList[key][0].id));
							}
						}else{
							for (let item of dataList[key]) {
								promiseArray.push(updateFlag("dky_"+key+"_info","isUpload","1",item.id));
							}
						}
					}
					Promise.all(promiseArray).then(function() {
						closeDB();
					}).catch(function (e) {
						console.log('Failed: ' +JSON.stringify(e));
					});
				});
			}else{
				plus.nativeUI.alert("上传企业平台失败，请稍后重试…",null, "提示", "确定");
			}
		},
		error: function(error) {
			plus.nativeUI.closeWaiting();
			console.log(JSON.stringify(error));
			plus.nativeUI.alert("上传企业平台失败，请稍后重试…",null, "提示", "确定");
		}
	});
}

/**
 * 上传钻孔数据到政府平台
 */
function ajax_uploadHoleToGov(dataList){
	$.ajax({
		type: "POST",
		url: server_government + '/geotdp/hole/uploadHole',
		data: JSON.stringify(dataList),
		dataType: "json",
		contentType: 'application/json; charset=UTF-8',
		success: function(data) {
			plus.nativeUI.closeWaiting();
			console.log(JSON.stringify(data));
			if(data.status){
				plus.nativeUI.alert("上传政府平台成功",null, "提示", "确定");
			}else{
				plus.nativeUI.alert(data.message,null, "提示", "确定");
			}
		},
		error: function(error) {
			plus.nativeUI.closeWaiting();
			console.log(JSON.stringify(error));
			plus.nativeUI.alert("上传政府平台失败，请稍后重试…",null, "提示", "确定");
		}
	});
}

//获取系统时间，返回yyyy-MM-dd hh:mm:ss格式
function getLocalTime(){
	var date = new Date();
	Y = date.getFullYear() + '-';
	M = (date.getMonth() + 1) + '-';
	D = date.getDate() + ' ';
	h = date.getHours() + ':';
	if(date.getMinutes() < 10) {
		m = '0' + date.getMinutes();
	} else {
		m = date.getMinutes();
	}
	if(date.getSeconds() < 10) {
		s = ':0' + date.getSeconds();
	} else {
		s = ':' + date.getSeconds();
	}
	return (Y + M + D + h + m+s);
}

//时间戳转换日期函数(2017-7-4 10:23:00)
function getFormatTime(nS) {
	var date = new Date(nS);
	Y = date.getFullYear() + '-';
	M = (date.getMonth() + 1) + '-';
	D = date.getDate() + ' ';
	h = date.getHours() + ':';
	if(date.getMinutes() < 10) {
		m = '0' + date.getMinutes();
	} else {
		m = date.getMinutes();
	}
	if(date.getSeconds() < 10) {
		s = ':0' + date.getSeconds();
	} else {
		s = ':' + date.getSeconds();
	}
	return (Y + M + D + h + m + s);
}


//时间戳转换日期函数(2017-7-4)
function getLocalDay(nS) {
	var date = new Date(nS);
	Y = date.getFullYear() + '-';
	M = (date.getMonth() + 1) + '-';
	D = date.getDate() + ' ';
	return(Y + M + D);
}


//格式化时间的辅助类，将一个时间转换成x小时前、y天前等
var dateUtils = {
	UNITS: {
		'年': 31557600000,
		'月': 2629800000,
		'天': 86400000,
		'小时': 3600000,
		'分钟': 60000,
		'秒': 1000
	},
	humanize: function(milliseconds) {
		var humanize = '';
		mui.each(this.UNITS, function(unit, value) {
			if(milliseconds >= value) {
				humanize = Math.floor(milliseconds / value) + unit + '前';
				return false;
			}
			return true;
		});
		return humanize || '刚刚';
	},
	format: function(dateStr) {
		var date = this.parse(dateStr)
		var diff = Date.now() - date.getTime();
		if(diff < this.UNITS['天']) {
			return this.humanize(diff);
		}

		var _format = function(number) {
			return(number < 10 ? ('0' + number) : number);
		};
		return date.getFullYear() + '/' + _format(date.getMonth() + 1) + '/' + _format(date.getDay()) + '-' + _format(date.getHours()) + ':' + _format(date.getMinutes());
	},
	parse: function(str) { //将"yyyy-mm-dd HH:MM:ss"格式的字符串，转化为一个Date对象
		var a = str.split(/[^0-9]/);
		return new Date(a[0], a[1] - 1, a[2], a[3], a[4], a[5]);
	}
};

/**
 * 两个数的计算，避免精度损失
 */
var Utils = {
	argAdd: function(arg1, arg2) {
		// 加法函数
		var _this = this,
			r1 = 0,
			r2 = 0,
			m = 0;
		try {
			r1 = arg1.toString().split(".")[1].length
		} catch(e) {}
		try {
			r2 = arg2.toString().split(".")[1].length
		} catch(e) {}
		m = Math.pow(10, Math.max(r1, r2))
		return _this.argDiv((_this.argMul(arg1, m) + _this.argMul(arg2, m)), m)
	},
	argSubtr: function(arg1, arg2) {
		// 减法函数
		var _this = this,
			r1 = 0,
			r2 = 0,
			m = 0;
		try {
			r1 = arg1.toString().split(".")[1].length
		} catch(e) {}
		try {
			r2 = arg2.toString().split(".")[1].length
		} catch(e) {}
		m = Math.pow(10, Math.max(r1, r2));
		return _this.argDiv((_this.argMul(arg1, m) - _this.argMul(arg2, m)), m)
	},
	argMul: function(arg1, arg2) {
		// 乘法函数
		var _this = this,
			m = 0,
			s1 = arg1.toString(),
			s2 = arg2.toString();
		try {
			m += s1.split(".")[1].length
		} catch(e) {}
		try {
			m += s2.split(".")[1].length
		} catch(e) {}
		return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
	},
	argDiv: function(arg1, arg2) {
		// 除法函数
		var _this = this,
			t1 = 0,
			t2 = 0,
			r1, r2;
		try {
			t1 = arg1.toString().split(".")[1].length
		} catch(e) {}
		try {
			t2 = arg2.toString().split(".")[1].length
		} catch(e) {}
		r1 = Number(arg1.toString().replace(".", ""))
		r2 = Number(arg2.toString().replace(".", ""))
		return _this.argMul((r1 / r2), Math.pow(10, t2 - t1));
	}
}


////touchstart事件
//window.addEventListener('touchstart', function(e) {
//console.log('start', e.touches[0].screenX+","+e.touches[0].clientX);
////  e.preventDefault()
//}, false)
//
////touchmove事件
//window.addEventListener('touchmove', function(e) {
//console.log('move', e.touches[0].screenX+","+e.touches[0].clientX);
////  e.preventDefault()
//}, false)
//
////touchend事件
//window.addEventListener('touchend', function(e) {
//console.log('end', e);
////  e.preventDefault()
//}, false)

/* app通用方法 end */