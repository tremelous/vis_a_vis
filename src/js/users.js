
/* Класс описывает локального игрока.
 * Класс должен ОБЯЗАТЕЛЬНО принять необходимые параметры в формате JSON:
 * {
 *   user_type: type - тип игрока, фиксирован....
 *   all_users: Game.Players, - содержит список удаленных игроков, чтобы отсылать им данные
 *   scene: THREE.Scene(); - объект сцены, в которую нужно будет добавить свой корабль
 * }
 * Пользователи сами обрабатывают медиа-вызовы!
 */  
 
var _LocalUser = function (json_params)
{
	
	this.setVideoTextureBF = this.setVideoTexture.bind(this);
	this.setPointsCallbackBF = this.setPointsCallback.bind(this);		

	if(json_params !== undefined)
	{
		this.Scene = json_params.scene;
		this.CSSScene = json_params.cssscene;
		this.UserType = USER_TYPES.LOCAL;
		this.AllUsers = json_params.all_users;
		this.NetMessagesObject = json_params.net_messages_object;
		this.Camera = json_params.camera;
		this.Peer = json_params.peer;
		this.VisavisCounter = json_params.visavis_counter;

		this.VisualKeeper = new _LocalVisualKeeper({scene: this.Scene, camera: this.Camera});
		this.Stream = json_params.stream;

		if(GLOBAL_OBJECTS.DeviceType === DEVICE_TYPES.MOBILE)
		{
			this.Controls = new THREEx.ComputerMobileControls({
				Object3D: this.VisualKeeper.getVideoMesh(),
				Camera: this.Camera
			});
		} else {
			this.Controls = new THREE.FlyControls(this.VisualKeeper.getVideoMesh(), document.getElementById("MainContainer"));
			this.Controls.movementSpeed = 90;
			this.Controls.rollSpeed = Math.PI / 42;
			this.Controls.autoForward = false;
			this.Controls.dragToLook = false;
		}

		
		this.Raycaster = new THREE.Raycaster();
		this.MouseVector = new THREE.Vector2();
		this.INTERSECTED = null;


	}else
		console.log(this.constructor.name + " have no json_params!");

	this.Person = GLOBAL_OBJECTS.getPerson();
	this.ChatControls = new _ChatControls({
		on_find_next_button_click: json_params.chat_controls_callback_bf,
		scene: this.Scene,
		cssscene: this.CSSScene
	});
	this.CollectingObjects = new _CollectingObjects(
		this.Scene,
		this.VisualKeeper.getVideoMesh(), 
		this.setPointsCallbackBF
	);
	this.VisualKeeper.setTargetMeshByColor(this.CollectingObjects.getColor());

	this.Points = {};
	this.Points.Div = document.createElement("div");
	document.body.appendChild(this.Points.Div);
	this.Points.Num = 0;
	this.Points.Div.appendChild(document.createTextNode("Очки:" + this.Points.Num));
	this.Points.Div.id = "PointsNumber";
	this.updateVisualPoints();

};


_LocalUser.prototype.sendMyCustomCaseViewParametersToAllRemoteUsers = function ()
{
	for(var i=0; i< this.AllUsers[1].length; i++)
	{
		this.AllUsers[1][i].sendAndSetMyCustomViewParameters(this.Person.getVideoMeshCaseParametersJSON());
	}
};

_LocalUser.prototype.getPerson = function ()
{

	return this.Person;
};

_LocalUser.prototype.getCollectingObjects = function ()
{
	return this.CollectingObjects;
};

_LocalUser.prototype.resetMeForNewRoom = function ()
{
	this.Points.Num -= POINTS.NEXT_ROOM_COST;
	this.updateVisualPoints();
	this.CollectingObjects.resetColor();
	this.CollectingObjects.deleteObjects();
	this.CollectingObjects.createObjects();
	this.VisualKeeper.setthis.AccelerometerControlsMeshByColor(this.CollectingObjects.getColor());
	this.hideChatControlsIfItNeed();
	this.VisualKeeper.getVideoMesh().lookAt(NULL_POINT);
};

_LocalUser.prototype.setPointsCallback = function (num)
{
	this.Points.Num += num;
	this.updateVisualPoints();
	if(this.Points.Num >= POINTS.NEXT_ROOM_COST)
	{
		this.showVisualChatControls();
	}
};

_LocalUser.prototype.updateVisavisCounter = function ()
{
};
/*
	It adds little Vis-a-Vis mesh to array, that will
	be add to Our Mesh.
*/
_LocalUser.prototype.addTargetMeshToMeshesArray = function (mesh)
{
	this.VisavisCounter.MeshesArray.push(mesh);
	this.getVisualKeeper().getVideoMesh().add(mesh);	
	var pos = new THREE.Vector3((-50/2+6)*(CAMERA_PARAMETERS.ASPECT), 50/2-7, -50);
	for(var i=0; i< this.VisavisCounter.MeshesArray.length; i++)
	{
		this.VisavisCounter.MeshesArray[i].position.copy(pos);
		this.VisavisCounter.MeshesArray[i].position.x += i*3;
	}
	this.VisavisCounter.Div.firstChild.data = "Визави: " + this.AllUsers[1].length;
	this.VisavisCounter.LastNum = this.AllUsers[1].length;
};

_LocalUser.prototype.removeTargetMeshFromMeshesArray = function (mesh)
{
	for(var i=0; i< this.VisavisCounter.MeshesArray.length; i++)
	{
		if(this.VisavisCounter.MeshesArray[i] === mesh){
			this.VisavisCounter.MeshesArray.splice(i, 1);
			this.getVisualKeeper().getVideoMesh().remove(mesh);	
		}
	}
	this.VisavisCounter.Div.firstChild.data = "Визави: " + this.AllUsers[1].length;
	this.VisavisCounter.LastNum = this.AllUsers[1].length;
};

_LocalUser.prototype.addPoints = function (num)
{
	this.Points.Num += num;
	this.updateVisualPoints();
	if(this.Points.Num >= POINTS.NEXT_ROOM_COST)
	{
		this.showVisualChatControls();
	}
};
_LocalUser.prototype.showVisualChatControls = function ()
{
	this.ChatControls.showFindNextRoomButton();
};
_LocalUser.prototype.hideVisualChatControls = function ()
{
	this.ChatControls.hideFindNextRoomButton();
};
_LocalUser.prototype.hideChatControlsIfItNeed = function ()
{
	if(this.Points.Num < 1000)
	{
		this.hideVisualChatControls();
	}
};

_LocalUser.prototype.updateVisualPoints = function ()
{
	this.Points.Div.removeChild(this.Points.Div.firstChild);
	this.Points.Div.appendChild(document.createTextNode("Очки:" + this.Points.Num));
};
_LocalUser.prototype.setRandomMeshPosition = function ()
{
	this.VisualKeeper.setRandomPosition();
};


_LocalUser.prototype.onClick = function ()
{
		
};

/*Функция устанавливает параметры для запроса для произведения выстрела 
 * и отправки запроса другим игрокам
 * IN:
 * json_params{
 *  gun_type: type
 * }
 *
 * OUT:
 * ret_params{
 *  distance: json_params.parameters.distance,
 * 	speed: json_params.parameters.speed,
 * 	direction: json_params.direction,
 * 	start_position: json_params.parameters.start_position,
 *	gun_type: "gun_type"			
 * }
 * 
 */

_LocalUser.prototype.setDataParameters = function (json_params)
{
};

/*Вызывается,когда мы должны переслать всем  
 *перемещения/стрельбы и присылает данные об этом
 * MoveMessage | ShootMessage (класс _QBorgGameNetMessages);
 * Локальный игрок не должен принимать данные, он их только отсылает
 * остальным участникам игры;
 */
_LocalUser.prototype.sendDataToAllRemoteUsers = function (message)
{
	if(typeof(message) !== "string")
	{
		message = JSON.stringify(message);
	}
	for(var i=0;i<this.AllUsers[1].length; i++)
	{
		if(this.AllUsers[1][i].ConnectionStatus === "open")
			this.AllUsers[1][i].Connection.send(message);
	}
};

/*Обновляет данные в объекте сообщений, которые будут отправляться другим
 *пользователям при перемещении
 * 
 */
_LocalUser.prototype.updateMessages = function ()
{
	this.NetMessagesObject.setPositionDataFromMesh(this.VisualKeeper.getVideoMesh());
};

_LocalUser.prototype.raycastingControl = function ()
{
	this.Raycaster.setFromCamera(this.MouseVector, this.Camera);

	var intersects = this.Raycaster.intersectObjects(this.Scene.children);
	if (intersects.length > 0)
	{
		if(this.INTERSECTED != intersects[0].object)
		{
			if(this.INTERSECTED)
				this.INTERSECTED.material.emissive.setHex(this.INTERSECTED.currentHex);
			this.INTERSECTED = intersects[0].object;
			this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
			
			this.INTERSECTED.material.emissive.setHex(0xff0000);
		}			
	}else
	{
		if (this.INTERSECTED)
			this.INTERSECTED.material.emissive.setHex(this.INTERSECTED.currentHex);
		this.INTERSECTED = null;
	}
	
};

/*Определяет дистанцию между пользователями и в зависимости от дистанции 
увеличивает|уменьшает уровень звука скрывает|показывает кейс!*/
_LocalUser.prototype.controlDistance = function ()
{
	for(var i=0; i< this.AllUsers[1].length; i++)
	{
		// if(!this.AllUsers[1][i].Stream)
		// {
		// 	continue;
		// }
		var distTo = this.VisualKeeper.getVideoMesh().position.distanceTo(this.AllUsers[1][i].getVideoMesh().position);
		if(distTo <= CONTROL_DISTANCE.VOLUME_RADIUS)
		{
			if(!this.AllUsers[1][i].wasBounded())
			{
				this.setPointsCallback(200);
				this.AllUsers[1][i].boundMe();
			}
			if(this.AllUsers[1][i].getVolume() !== 1){
				this.AllUsers[1][i].setVolume(1);
			}
		} else
		{
			if(this.AllUsers[1][i].getVolume() !== 0)
			{
				this.AllUsers[1][i].setVolume(0);
			}
		}
		
		if(distTo <= CONTROL_DISTANCE.CASE_HIDE_RADIUS)
		{
			if(this.AllUsers[1][i].getOpacity() !== 0)
			{
				this.AllUsers[1][i].setOpacity(0);			
				this.AllUsers[1][i].makeMediaCallToMe(this.Stream);
			}
		} else 
		if(distTo <= CONTROL_DISTANCE.CASE_RADIUS)
		{
			this.AllUsers[1][i].setOpacity(distTo/CONTROL_DISTANCE.CASE_RADIUS*this.AllUsers[1][i].getSourceOpacity());
			/////////////////////////??????!!!!!!!!!!!!!!!!!!!!!!!
//			this.AllUsers[1][i].makeMediaCallToMe(this.Stream);
			/////////////////////////??????!!!!!!!!!!!!!!!!!!!!!!!
		} else
		{
			if(this.AllUsers[1][i].getOpacity() !== this.AllUsers[1][i].getSourceOpacity())
			{
				this.AllUsers[1][i].setOpacity(this.AllUsers[1][i].getSourceOpacity());
				this.AllUsers[1][i].deleteMediaConnection();
			}
		}
	}
};


_LocalUser.prototype.movingControl = function ()
{
	if(this.VisualKeeper.getVideoMesh().position.x >= WORLD_CUBE.SCALED_SIZE.x/2){
		this.VisualKeeper.getVideoMesh().position.x = WORLD_CUBE.SCALED_SIZE.x/2 - 100;
	}

	if(this.VisualKeeper.getVideoMesh().position.x <= -WORLD_CUBE.SCALED_SIZE.x/2){
		this.VisualKeeper.getVideoMesh().position.x = -WORLD_CUBE.SCALED_SIZE.x/2 + 100;
	}

	if(this.VisualKeeper.getVideoMesh().position.y >= WORLD_CUBE.SCALED_SIZE.y/2){
		this.VisualKeeper.getVideoMesh().position.y = WORLD_CUBE.SCALED_SIZE.y/2 - 100;
	}

	if(this.VisualKeeper.getVideoMesh().position.y <= -WORLD_CUBE.SCALED_SIZE.y/2){
		this.VisualKeeper.getVideoMesh().position.y = -WORLD_CUBE.SCALED_SIZE.y/2 + 100;
	}

	if(this.VisualKeeper.getVideoMesh().position.z >= WORLD_CUBE.SCALED_SIZE.z/2){
		this.VisualKeeper.getVideoMesh().position.z = WORLD_CUBE.SCALED_SIZE.z/2 - 100;
	}

	if(this.VisualKeeper.getVideoMesh().position.z <= -WORLD_CUBE.SCALED_SIZE.z/2){
		this.VisualKeeper.getVideoMesh().position.z = -WORLD_CUBE.SCALED_SIZE.z/2 + 100;
	}

};


/* Обновляет все необходимые объекты и проводит вычисления
 */
_LocalUser.prototype.update = function (mult)
{
	this.Controls.update(mult/100);
	this.CollectingObjects.update();
	this.updateMessages();
	this.sendDataToAllRemoteUsers(this.NetMessagesObject.MoveMessage);	
	this.controlDistance();
//	this.VisualKeeper.update();
	this.movingControl();
/*	
	document.getElementById("ID_VIEWER").innerHTML = this.VisualKeeper.getVideoMesh().position.x + " " + 
	this.VisualKeeper.getVideoMesh().position.y + " "
	 + this.VisualKeeper.getVideoMesh().position.z;
*/
//	this.ChatControls.update(this.VisualKeeper.getVideoMesh().position, this.VisualKeeper.getVideoMesh().rotation);
};


_LocalUser.prototype.getMesh = function ()
{
	return this.VisualKeeper.getMesh();
};

_LocalUser.prototype.getVisualKeeper = function ()
{
	return this.VisualKeeper;
};
_LocalUser.prototype.getStream = function ()
{
	return this.Stream;
};

_LocalUser.prototype.setVideoTexture = function(source)
{
	this.VisualKeeper.setVideoTextureByStream(source);
};

/*
 * It makes calls to all accessed remote users 
*/
_LocalUser.prototype.makeCallsToAllRemoteUsers = function (json_params)
{
	for(var i=0; i<this.AllUsers[1].length; i++)
	{
		this.Peer.call(this.AllUsers[1][i].getPeerID(), this.Stream);
	}
};


/* Класс описывает игрока.
 * Класс должен ОБЯЗАТЕЛЬНО принять необходимые параметры в формате JSON:
 * {
 *   net_messages_object: nmo,		
 *   connection: connection, - соединение, из которого будут приходить данные, и в которое будут данные отправляться
 *   scene: THREE.Scene(); - объект сцены, в которую нужно будет добавить свой корабль,
 *   random: true | false
 * }
 * Класс удаленного игрока обрабатывает только входящие сообщения, но НИЧЕГО НЕ ОТСЫЛАЕТ!
 * 
 */

var _RemoteUser = function (json_params)
{
	this.Scene = null;		
	this.Connection = null; /*Соединение игрока*/
	this.NetMessagesObject = null; /*Объект сетевых сообщений*/
	this.AllUsers = null; /*Массив всех пользователей*/
	this.ConnectionStatus = null; /*Статус соединения*/
	this.MediaConnection = null; /*Хранит медиасоединение, по которому приходят видеоряд и звук*/
	this.UserType = USER_TYPES.REMOTE; /*Удалённый пользователь*/
	this.BoundedStatus = false;
	this.Person = new _RemotePerson(); /*Персона, которая хранит внутренние данные*/
	this.makeMediaCallToMe = this.makeMediaCallToMe.bind(this);

	if(json_params instanceof Object)
	{
		this.Scene = json_params.scene;		
		this.Connection = json_params.connection;
		this.NetMessagesObject = json_params.net_messages_object;
		this.AllUsers = json_params.all_users;
		this.VisualKeeper = new _RemoteVisualKeeper({scene: this.Scene, random: true});
		this.ID = json_params.id;		
		
	}else
		throw new Error(this.constructor.name + " have no json_params!");
  
	this.onOpenConnectionBF = this.onOpenConnection.bind(this);
	this.Connection.on("open", this.onOpenConnectionBF);
	
	this.onDataRecievedFunc = this.onDataRecieved.bind(this); 
	this.Connection.on("data",  this.onDataRecievedFunc);

	this.onCloseConnectionFunc = this.disconnect.bind(this); 
	this.Connection.on("close", this.onCloseConnectionFunc);  

	this.onConnectionErrorFunc = this.onConnectionError.bind(this); 
	this.Connection.on("error", this.onConnectionErrorFunc);

	this.makeMediaConnectionAnswerBF = this.makeMediaConnectionAnswer.bind(this);
	this.onStreamBF = this.onStream.bind(this);
	this.onMediaConnectionCloseBF = this.onMediaConnectionClose.bind(this);
	this.onMediaConnectionErrorBF = this.onMediaConnectionError.bind(this);

};

_RemoteUser.prototype.wasBounded = function ()
{
	return this.BoundingStatus;
};
_RemoteUser.prototype.boundMe = function ()
{
	this.BoundingStatus = true;
};

_RemoteUser.prototype.getPeerID = function ()
{
	return this.Connection.peer;
};

_RemoteUser.prototype.onCall = function (call)
{
	this.MediaConnection = call;
	this.MediaConnection.on("stream", this.onStreamBF);
	this.MediaConnection.on("close", this.onMediaConnectionCloseBF);
	this.MediaConnection.on("error", this.onMediaConnectionErrorBF);

	this.MediaConnection.answer(this.AllUsers[0].getStream());
};


/*
	This function makes answer
 */
_RemoteUser.prototype.makeMediaConnectionAnswer = function (stream)
{
	this.MediaConnection.answer(stream);
};
/*	This function catches stream from remote user 
 */
_RemoteUser.prototype.onStream = function (stream)
{
	this.Stream = stream;
	this.VisualKeeper.setVideoTextureByStream(this.Stream);
};

_RemoteUser.prototype.onMediaConnectionClose = function ()
{
//	this.disconnect();
};
_RemoteUser.prototype.onMediaConnectionError = function ()
{
	this.disconnect();
};


/* при открытии соединения!
 */
_RemoteUser.prototype.onOpenConnection = function()
{
	this.Connection.send(JSON.stringify(this.NetMessagesObject.GetNickNameMessage));
	this.NetMessagesObject.setGetYourVisualKeeperCaseMeshParametersDataMessage(this.AllUsers[0].getPerson().getAllVideoMeshCaseParametersForNetMessageJSON());
	this.Connection.send(JSON.stringify(this.NetMessagesObject.GetYourVisualKeeperCaseMeshParametersMessage));
	this.ConnectionStatus = "open";
};

/* завершаем соединение с игроком
 */
_RemoteUser.prototype.disconnect = function()
{
	if(this.Connection)
		this.Connection.close();
	if(this.MediaConnection)
		this.MediaConnection.close();
	this.ConnectionStatus = "closed";
	this.AllUsers[0].removeTargetMeshFromMeshesArray(this.VisualKeeper.getTargetMesh());
	this.VisualKeeper.removeFromScene();
	console.log("connection was closed");

	for(var i=0; i< this.AllUsers[1].length; i++)
	{
		if(this.AllUsers[1][i].getPeerID() === this.getPeerID())
		{
			this.AllUsers[1].splice(i, 1);
		}
	}
};

_RemoteUser.prototype.onConnectionError = function(error)
{
	this.disconnect();
	this.ConnectionStatus = "closed";
	console.log("Had " + error + " on: " + this.constructor.name + ".onConnectionError()");
};
/*
	This function will trying to create MediaConnection with RemoteUser
	while it's will not be made.
*/
_RemoteUser.prototype.makeMediaCallToMe = function (stream) 
{
	if(this.MediaConnection === null)
	{
		this.MediaConnection = this.AllUsers[0].Peer.call(this.getPeerID(), stream);
		this.MediaConnection.on("stream", this.onStreamBF);
		setTimeout(this.makeMediaCallToMe, 1000, stream);
	} else {
		return;
	}
};
/*
	This function will trying to create MediaConnection with RemoteUser
	while it's will not be made.
*/
_RemoteUser.prototype.deleteMediaConnection = function () 
{
	if(this.MediaConnection)
	{
		this.MediaConnection.close();
		this.MediaConnection = null;
		delete this.Stream;
		this.Stream = null;
	}
};
_RemoteUser.prototype.removeVisualKeeperFromScene = function ()
{
	this.VisualKeeper.removeFromScene();
};
/*Вызывается, когда удаленный игрок совершает действия типа 
 *перемещения/стрельбы и присылает данные об этом
 * MoveMessage | ShootMessage (класс _QBorgGameNetMessages)
 */  
_RemoteUser.prototype.onDataRecieved = function (json_params)
{
	// преобразуем полученные данные, если они не преобразованы в объект
	if(typeof(json_params) === "string")
	{
		json_params = JSON.parse(json_params);
	}
	

	switch(json_params.request){

	case REQUESTS.UTOU.MOVE:
		this.VisualKeeper.setPosition(json_params.data.position);
		this.VisualKeeper.setRotation(json_params.data.rotation);
	break;		

	case REQUESTS.UTOU.GET_YOUR_VISUAL_KEEPER_CASE_MESH_PARAMETERS:
		this.Person.setVideoMeshCaseParametersByJSON(json_params);
		this.setVisualKeeperByPersonAndAddToScene();
		this.NetMessagesObject.setSendMyVisualKeeperCaseMeshParametersDataMessage(this.AllUsers[0].getPerson().getAllVideoMeshCaseParametersForNetMessageJSON());
		this.Connection.send(JSON.stringify(this.NetMessagesObject.SendMyVisualKeeperCaseMeshParametersMessage));
	break;

	case REQUESTS.UTOU.SEND_MY_VISUAL_KEEPER_CASE_MESH_PARAMETERS:
		this.Person.setVideoMeshCaseParametersByJSON(json_params);
		this.setVisualKeeperByPersonAndAddToScene();
	break;

	case REQUESTS.UTOU.SHOOT:
		json_params.data.all_users = this.AllUsers;
		json_params.data.owner_id = this.ID;
		this.VisualKeeper.shoot(json_params.data);
	break;

	case REQUESTS.UTOU.SEND_NICKNAME:
		this.Nickname = json_params.data.nickname;
		this.ID = json_params.data.id;
	break;

	case REQUESTS.UTOU.GET_NICKNAME:
		this.Nickname = json_params.data.requested_user_nickname;
		this.ID = json_params.data.requested_user_id;
		this.Connection.send(JSON.stringify(this.NetMessagesObject.SendNickNameMessage));
	break;



	default:
		console.log("WTF???");
	break;
	}

};

_RemoteUser.prototype.setVisualKeeperByPersonAndAddToScene = function ()
{
	this.AllUsers[0].removeTargetMeshFromMeshesArray(this.VisualKeeper.getTargetMesh());
	this.VisualKeeper.removeCaseMeshFromScene();
	this.VisualKeeper.setVisualMeshCase(this.Person.getVideoMeshCase());
	this.VisualKeeper.setTargetMesh(this.Person.getTargetMesh());
	this.AllUsers[0].addTargetMeshToMeshesArray(this.VisualKeeper.getTargetMesh());
	this.VisualKeeper.addCaseMeshToScene();
};

_RemoteUser.prototype.update = function ()
{
	this.VisualKeeper.update();
};

_RemoteUser.prototype.getVideoMesh = function ()
{
	return this.VisualKeeper.getVideoMesh();
};

_RemoteUser.prototype.getVisualKeeper = function ()
{
	return this.VisualKeeper;
};

_RemoteUser.prototype.setVideoTexture = function(source)
{
	this.VisualKeeper.setVideoTextureByStream(source);
};

_RemoteUser.prototype.setVolume = function (vol)
{
	this.VisualKeeper.Video.volume = vol;
}
_RemoteUser.prototype.getVolume = function ()
{
	return this.VisualKeeper.Video.volume;
}

_RemoteUser.prototype.getSourceOpacity = function ()
{
	return this.VisualKeeper.VideoMeshCaseOpacity;
};
_RemoteUser.prototype.getOpacity = function ()
{
	return this.VisualKeeper.VideoMesh.Case.material.opacity;
};
_RemoteUser.prototype.setOpacity = function (op)
{
	this.VisualKeeper.VideoMesh.Case.material.opacity = op;
};
_RemoteUser.prototype.sendAndSetMyCustomViewParameters = function (json_params)
{
	this.NetMessagesObject.setGetYourVisualKeeperCaseMeshParametersDataMessage(json_params);
	this.Connection.send(JSON.stringify(this.NetMessagesObject.GetYourVisualKeeperCaseMeshParametersDataMessage));
};
