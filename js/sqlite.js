//本地数据库操作

/**
 * 创建数据库
 */
function createDB(){
	plus.sqlite.openDatabase({
		name: 'plantdb',
		path: localStorage.getItem('dbFile'),
		success: function(e) {
			console.log("创建数据库成功");
			plus.sqlite.executeSql({
				name: 'plantdb',
				sql: createSql,
				success: function(e) {
					console.log("创建数据表成功");
					return true;
				},
				fail: function(e) {
					return false;
				}
			});
		},
		fail: function(e) {
			return false;
		}
	});
}

/**
 * 打开数据库
 */
function openDB() {
	var promise = new Promise(function(resolve, reject) {
		if(plus.sqlite.isOpenDatabase({
			name: 'plantdb',
			path:localStorage.getItem('dbFile')
		})){
			resolve();
		}else{
			plus.sqlite.openDatabase({
				name: 'plantdb',
				path: localStorage.getItem('dbFile'),
				success: function(e) {
					console.log("打开数据库成功："+JSON.stringify(e));
					resolve();
				},
				fail: function(e) {
					console.log('关闭数据库成功: '+JSON.stringify(e));
					reject(e);
				}
			});
		}
	});
	return promise;
}

/**
 * 插入数据
 * table_name:表名,
 * entity:实体(包含key:value)
 */
function insert(table_name,entity){
	var promise = new Promise(function(resolve, reject) {
		let keys="";
		let values="";
		
		for (let o in entity) {
			keys+='"'+o+'",';
			values+='"'+encrypt(entity[o])+'",';
		}
		
		keys=keys.substr(0,keys.length-1);
		values=values.substr(0,values.length-1);
		console.log("准备插入数据");
		console.log('insert into '+table_name+'('+keys+') values('+values+')');
		plus.sqlite.executeSql({
			name: 'plantdb',
			sql: 'insert into '+table_name+'('+keys+') values('+values+')',
			success: function(data){
				console.log("插入数据成功："+JSON.stringify(data));
				resolve(data);
			},
			fail: function(e){
				console.log("插入数据失败："+JSON.stringify(e));
				reject(e);
			}
		});
	});
	return promise;
}

/**
 * 修改数据
 * table_name:表名,
 * entity:实体(包含key:value),
 * id:实体的id
 */
function update(table_name,entity,id){
	var promise = new Promise(function(resolve, reject) {
		let sql="";
		
		id=encrypt(id);
		for (let o in entity) {
			sql+='"'+o+'"="'+encrypt(entity[o])+'",';
		}
		
		sql=sql.substr(0,sql.length-1);
		console.log("准备更新数据");
		console.log('update '+table_name+' set '+sql+' where id="'+id+'"');
		plus.sqlite.executeSql({
			name: 'plantdb',
			sql: 'update '+table_name+' set '+sql+' where id="'+id+'"',
			success: function(data){
				console.log("更新数据成功："+JSON.stringify(data));
				resolve(data);
			},
			fail: function(e){
				console.log("更新数据失败："+JSON.stringify(e));
				reject(e);
			}
		});
	});
	return promise;
}

/**
 * 修改flag
 * table_name:表名,
 * flag:待修改字段,
 * value:修改值,
 * id:实体的id
 */
function updateFlag(table_name,flag,value,id){
	console.log('update '+table_name+' set '+flag+'="'+encrypt(value)+'" where id="'+encrypt(id)+'"');
	var promise = new Promise(function(resolve, reject) {
		plus.sqlite.executeSql({
			name: 'plantdb',
			sql: 'update '+table_name+' set '+flag+'="'+encrypt(value)+'" where id="'+encrypt(id)+'"',
			success: function(data){
				resolve(data);
			},
			fail: function(e){
				reject(e);
			}
		});
	});
	return promise;
}

/**
 * 根据id删除单条数据
 * table_name:表名,
 * id:实体的id
 */
function deleteOne(table_name,id){
	let sql;
	if(table_name=="sys_dict"){
		sql='delete from '+table_name+' where id="'+id+'"';
	}else{
		sql='delete from '+table_name+' where id="'+encrypt(id)+'"';
	}
	var promise = new Promise(function(resolve, reject) {
		plus.sqlite.executeSql({
			name: 'plantdb',
			sql:sql ,
			success: function(data){
				resolve(data);
			},
			fail: function(e){
				reject(e);
			}
		});
	});
	return promise;
}

/**
 * 根据条件删除多条数据
 * table_name:表名,
 * whereSql:查询条件（key=value）
 */
function deleteSql(table_name,whereSql){
	var promise = new Promise(function(resolve, reject) {
		plus.sqlite.executeSql({
			name: 'plantdb',
			sql: 'delete from '+table_name+' where '+whereSql,
			success: function(data){
				console.log("删除数据成功："+JSON.stringify(data));
				resolve(data);
			},
			fail: function(e){
				console.log("删除数据失败："+JSON.stringify(e));
				reject(e);
			}
		});
	});
	return promise;
}

/**
 * 清空表
 * table_name:表名
 */
function clear(table_name){
	var promise = new Promise(function(resolve, reject) {
		plus.sqlite.executeSql({
			name: 'plantdb',
			sql: 'delete from '+table_name,
			success: function(data){
				resolve(data);
			},
			fail: function(e){
				reject(e);
			}
		});
	});
	return promise;
}

/**
 * 查询表中全部数据
 * table_name:表名
 */
function selectAll(table_name){
	var promise = new Promise(function(resolve, reject) {
		plus.sqlite.selectSql({
			name: 'plantdb',
			sql: 'select * from '+table_name,
			success: function(data){
				if(table_name!="sys_dict"){
					for (let i in data) {
						for (let key in data[i]) {
							if(data[i][key]!=null){
								data[i][key]=decrypt(data[i][key]);
							}else{
								data[i][key]="";
							}
						}
					}
				}
				//console.log("查询数据成功："+JSON.stringify(data));
				resolve(data);
			},
			fail: function(e){
				console.log("查询数据失败："+JSON.stringify(e));
				reject(e);
			}
		});
	});
	return promise;
}

/**
 * 查询符合id的数据
 * table_name:表名,
 * id:主键
 */
function selectById(table_name,id){
	var promise = new Promise(function(resolve, reject) {
		plus.sqlite.selectSql({
			name: 'plantdb',
			sql: 'select * from '+table_name+' where id="'+encrypt(id)+'"',
			success: function(data){
				if(table_name!="sys_dict"){
					for (let i in data) {
						for (let key in data[i]) {
							if(data[i][key]!=null){
								data[i][key]=decrypt(data[i][key]);
							}else{
								data[i][key]="";
							}
						}
					}
				}
				console.log('查询数据成功: '+data.length);
				resolve(data);
			},
			fail: function(e){
				console.log('查询数据失败: '+JSON.stringify(e));
				reject(e);
			}
		});
	});
	return promise;
}

/**
 * 查询符合条件的数据
 * table_name:表名,
 * whereSql:查询条件（key=value）
 */
function selectSQL(table_name,whereSql,orderBy){
	var sql="";
	if(orderBy==undefined || orderBy=="" || orderBy==null){
		sql='select * from '+table_name+" where "+whereSql;
	}else{
		sql='select * from '+table_name+" where "+whereSql+" order by "+orderBy;
	}
	console.log(sql);
	var promise = new Promise(function(resolve, reject) {
		plus.sqlite.selectSql({
			name: 'plantdb',
			sql: sql,
			success: function(data){
				if(table_name!="sys_dict"){
					for (let i in data) {
						for (let key in data[i]) {
							if(data[i][key]!=null){
								data[i][key]=decrypt(data[i][key]);
							}else{
								data[i][key]="";
							}
						}
					}
				}
				//console.log("查询数据成功："+JSON.stringify(data));
				resolve(data);
			},
			fail: function(e){
				console.log('查询数据失败: '+JSON.stringify(e));
				reject(e);
			}
		});
	});
	return promise;
}

/**
 * 关闭数据库
 */
function closeDB(){
	var promise = new Promise(function(resolve, reject) {
		plus.sqlite.closeDatabase({
			name: 'plantdb',
			success: function(e) {
				console.log("关闭数据库成功："+JSON.stringify(e));
				resolve(e);
			},
			fail: function(e) {
				console.log("关闭数据库失败："+JSON.stringify(e));
				reject(e);
			}
		});
	});
	return promise;
}

/**
 * 判断数据库是否打开
 */
function isOpenDB(){
	if(plus.sqlite.isOpenDatabase({
		name: 'plantdb',
		path: localStorage.getItem('dbFile'),
	})){
		return true;
	}else{
		return false;
	}
}

//数据库加密解密设置和方法
// AES 秘钥
var AesKey = "BJDKY-MZY-57-ZWP";
 
// 偏移量
var CBCIV = "9281739481926103";
 
// 加密选项
var CBCOptions = {
	iv: CryptoJS.enc.Utf8.parse(CBCIV),
	mode:CryptoJS.mode.CBC,
	padding: CryptoJS.pad.Pkcs7
}
 

/**
 * AES加密（CBC模式，需要偏移量）
 * @param data
 * @returns {*}
 */
function encrypt(data){
    var key = CryptoJS.enc.Utf8.parse(AesKey);
    var secretData = CryptoJS.enc.Utf8.parse(data);
    var encrypted = CryptoJS.AES.encrypt(
		secretData, 
		key, 
		CBCOptions
	);
	return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encrypted.toString()));
}
 
/**
 * AES解密（CBC模式，需要偏移量）
 * @param data
 * @returns {*}
 */
function decrypt(data){
    var key = CryptoJS.enc.Utf8.parse(AesKey);
	let decData = CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
    var decrypt = CryptoJS.AES.decrypt(
		decData, 
		key, 
		CBCOptions
	);
	return decrypt.toString(CryptoJS.enc.Utf8);
}
