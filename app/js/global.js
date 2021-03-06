// inject firebase service
var app = angular.module("teamforming", ["firebase"]); 


app.value('user', {
    email: '',
	role:'',
	userName:'',
	key:'',
	course:[],
	team:[]
});


app.controller("wrapperCtrl", function($scope,$rootScope,user) {
			
			$rootScope.$on("updataEmailCall", function(){
			   $scope.updataEmail();
				$rootScope.$emit("updateRole", {});
			});
						
			
			$scope.updataEmail=function()
			{
				$scope.email=user.email;
				$scope.userName=user.userName;
				$scope.role=user.role;
				
			}
			$scope.logout = function() {
				firebase.auth().signOut().then(function() {
				  console.log('Signed Out');
				}, function(error) {
				  console.error('Sign Out Error', error);
				});
			window.location = "login.html";
			}
			
});
app.controller("dashBoardCtrl", function($scope,$rootScope,user, $firebaseArray) {
		// sync with firebaseArray
		$this=this;
		var userAccount = firebase.database().ref("UserAccount");
		$scope.userAccount = $firebaseArray(userAccount);

		function getUserInfo(email)
		{	
			console.log("test");
			userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
			{

				//set user email to global
				user.email=data.val().email;
				user.role=data.val().role;
				user.userName=data.val().userName;
				user.key=data.getKey();
				user.course=data.val().course;
				user.team=data.val().team;
				
				$rootScope.$emit("updataEmailCall", {});	
				
				if(user.role=="0")
				{
					console.log("you are logined as studnet");
				}
				else
				{
					console.log("you are logined as teacher");	
				}
			});

		}
	
		$this.isLogined=function ()
		{	
		
			firebase.auth().onAuthStateChanged(function(user) {
			  if (user) 
			  {
				// User is signed in.
				getUserInfo(user.email);

			  }
			  else
			  {
				  window.location = "login.html";//redirect to login page if the user is not logined
			  }
			});
		}
		
		$this.init=function()
		{
			$this.isLogined();
		};
		$this.init();
		
	});
	
app.controller("createCoursesCtrl", function($scope,$rootScope,user, $firebaseArray) {
		$this=this;
		/*initialzation and checking*/
		var courses = firebase.database().ref("courses");
		$scope.courses = $firebaseArray(courses);
		var userAccount = firebase.database().ref("UserAccount");
		$scope.userAccount = $firebaseArray(userAccount);
		
		$this.doRedirect=function (href) {
			window.location = href;
		}
		
		$this.redirect=function()
		{
			if($scope.role!="1")
			{
				 $this.doRedirect("index.html");// only the teacher role can enter create course page
			}
			
		}
		
		$this.initDatePicker= function ()
		{
			$('#datepicker').datepicker({
				format: 'dd/mm/yyyy',
				startDate: '-0d'
			});
		}
		
		$scope.updateRole=function()
		{
			$scope.email=user.email;
			$scope.role=user.role;
			$scope.userName=user.userName;
			$scope.key=user.key;
		}
	
		$rootScope.$on("updateRole", function(){
			   $scope.updateRole();
				$this.redirect();
				$this.initDatePicker();
		});
		

		/*create course functions*/
		
		File.prototype.convertToBase64 = function(callback){		//function of  convert uploaded image to base64 image
			var reader = new FileReader();
			reader.onload = function(e) {
				 callback(e.target.result)
			};
			reader.onerror = function(e) {
				 callback(null);
			};        
			reader.readAsDataURL(this);
		};
		
		$scope.fileNameChanged = function (ele) // trigger when user upload a file
		{
		  var file = ele.files[0];
		  if(file.type.length>0&&file.type.substr(0,5)=="image")  // check for the format type of the chose file
		  {
				file.convertToBase64(function(base64)
				{
					$scope.courseInfo.image=base64;
					$scope.fileName=file.name;
					$('#base64PicURL').attr('src',base64);
					$('#base64Name').html(file.name);
					$('#removeURL').show();
					$('#profilePic').val('');
				}); 		  	  
		  }
		  else
		  {
			  alert("invliad file format");
			  $scope.removeImg();
			  $('#profilePic').val('');
		  }

		}
		
		$scope.courseInfo=
		{
			title:"",
			image:"image/grey.png",
			owner:"",
			message:"",
			max:"",
			min:"",
			date:""
		}
		$scope.fileName;
		
		$scope.removeImg=function(){ //function for remove the uploaded image
		
			$('#removeURL').hide();
			$('#base64Name').html('');
			$scope.courseInfo.image='image/grey.png';
			$scope.fileName='';
			$('#base64PicURL').attr('src','');

		}
		
		$this.validInput=function ()// check if any empty input of essential data or invalid input
		{
			if($scope.courseInfo.title==""||$scope.courseInfo.message==""||$scope.courseInfo.min==""||$scope.courseInfo.max==""||$scope.courseInfo.date=="")
			{
				alert("some missing data");
				return false;
			}
			if($scope.courseInfo.min>$scope.courseInfo.max)
			{
				alert("min should be small than max");
				return false;
			}
			return true;	
		}
		
		/*create course flow*/
		/*
			add an entry in courses table
			add the course id to the course array in the  course's owner user
		*/
		
		$scope.createCourse = function() {
			var isError=false;
			if($this.validInput())
			{
				$scope.courseInfo.owner=$scope.email;
			
				$scope.courses.$add($scope.courseInfo).then(function(){
					var courseArray=[];
					courses.orderByChild("owner").equalTo($scope.email).on("child_added", function(data)
					{
						courseArray.push(data.getKey());

						firebase.database().ref("UserAccount/"+$scope.key).once('value', function(data) {
				
							var newUserData=data.val();
							newUserData.course=courseArray;
							firebase.database().ref("UserAccount/"+$scope.key).set(newUserData);
						});						
						isError=false;
					});

				}, function(error) {
				  isError=true;
				  alert("some error occur");
				  console.error(error);
				}).then(function(){
					
					if(!isError)
					{
						 window.location = "index.html";
					}			
				});		
				
			}

		}

	});
	
	
app.controller("indexCtrl", function($scope,$rootScope,user,$firebaseArray,$window) {
		$this=this;
		/*initialzation and checking*/
		var courses = firebase.database().ref("courses");
		$scope.courseFB=$firebaseArray(courses);
		var userAccount = firebase.database().ref("UserAccount");
	
		$scope.updateRole=function()
		{
			$scope.email=user.email;
			$scope.role=user.role;
			$scope.userName=user.userName;
			$scope.key=user.key;
			$scope.course=user.course;
			$scope.team=user.team;
		}
		$scope.courseArray=[];
	
		$rootScope.$on("updateRole", function(){
			   $scope.updateRole();
			   $this.loadcourses();
		});
		
		$this.loadcourses=function ()
		{
			if(typeof($scope.course)!="undefined")
			{
				var tmpCourse=[];
				for(i=0;i<$scope.course.length;i++)
				{
					firebase.database().ref("courses/"+$scope.course[i]).once('value', function(data) {
						tmpCourse.push({"key":data.getKey(),"data":data.val()});	
						
					});
				}
				$scope.courseArray=tmpCourse;
			}
		}	
		
		/*****page access control*****/
		
		//redirect the page when user click on "view detail"
		//student without team -> teamsearch
		//others -> teampannel
		
		$this.teamChecking=function (key)
		{
			if(typeof($scope.team)=="undefined")
			{
				console.log("not hv any team yet");
				return true;
			}
			else
			{
			
				if($scope.team.hasOwnProperty(key) )
				{
					console.log("has team in this course");
					return false;
				}
				else
				{
					console.log("no team in this course");
					return true;
				}
			}
			
		}
		
		$scope.dashBoardChangePage=function(key)
		{

			if(user.role=="0" && $this.teamChecking(key))
			{
				$this.doRedirect("teamSearch.html?c="+key);
				
			}else
			{
				$this.doRedirect("teamPanel.html?c="+key);
			}
			
		}
		
		$this.doRedirect=function(href)
		{
			$window.location.href=href;
		}
		
	
});



app.controller("teamSearchCtrl", function($scope,$rootScope,user,$firebaseArray,$window) {
		$this=this;
		/*initialzation and checking*/
		var courses = firebase.database().ref("courses");
		$scope.courseFB=$firebaseArray(courses);
		var team = firebase.database().ref("Team");
		$scope.teamInfo = $firebaseArray(team);
		var userAccount = firebase.database().ref("UserAccount");
		$scope.userAccount = $firebaseArray(userAccount);
		
		
		//team filter variables
		$scope.query = {}
		$scope.searchBy = '$'
		$scope.orderProp="name";   
	
		$scope.updateRole=function()
		{
			$scope.email=user.email;
			$scope.role=user.role;
			$scope.userName=user.userName;
			$scope.key=user.key;
			$scope.course=user.course;
			$scope.team=user.team;
		}
		
		$scope.ckey="";
	
		$scope.currCourse={};
		
		$scope.newTeam=
		{
			name:"",
			description:"",
			leaderID:"",
			member:[],
			courseID:""
		};

		$scope.existedTeam=[];

		$rootScope.$on("updateRole", function(){
			   $scope.updateRole();
			   $this.loadcoursesInfo();
		});
		
		$scope.requestValid=true;
		
		/*checking list*/
		/*
			join request&&delete request
			1. if has team in that course, redirect to the team panel
			delete request
			2.if not in the request list in that team, update the interface by loading team data again
		*/
		
		$this.requestValidCheck = function(operation,key)//1 is delete request, 0 is join request
		{
			firebase.database().ref("UserAccount/"+$scope.key).once('value', function(data) 
			{
				if(typeof(data.val().team)!="undefined")
				{
					if(data.val().team.hasOwnProperty($scope.ckey))
					{
						alert("You have joined a group alreay");
						$window.location.href="teamPanel.html?c="+$scope.ckey;	
						$scope.requestValid=false;
					}
				}
				if(operation==1)
				{
					firebase.database().ref("Team/"+key).once('value', function(data) {
						if(typeof(data.val().request)!="undefined")
						{
							if(data.val().request.indexOf($scope.email)==-1)
							{
								alert("you are not in the waiting list");
								$this.loadExistedTeam();
								$scope.requestValid=false;
							}
						}
						else
						{
							alert("you are not in the waiting list");
							$this.loadExistedTeam();
							$scope.requestValid=false;
						}
					});
				}

			});
		}
		
		/*remove request flow*/
		/*
			1. delete the user email in the  request array in the Team table
			2. delete the team id in specific course array of request object in UserAccount table
			3. set the joined variable be false
		*/
		
		$scope.removeRequest=function(i,key)
		{
			$.when($this.requestValidCheck(1,key)).done(function() 
			{
				if($scope.requestValid)
				{
					firebase.database().ref("Team/"+key).once('value', function(data) {
						var newTeamData=data.val();
						$this.removeElementFromArrayByValue($scope.email,newTeamData.request);
						firebase.database().ref("Team/"+key).set(newTeamData);
					});
					firebase.database().ref("UserAccount/"+$scope.key).once('value', function(data) {
						var newUserData=data.val();
						$this.removeElementFromArrayByValue(key,newUserData.request[$scope.ckey]);
						if(typeof(newUserData.request[$scope.ckey])=="undefined")
						{
							if(jQuery.isEmptyObject(newUserData.request))
							{
								delete newUserData["request"];
							}
						}

						firebase.database().ref("UserAccount/"+$scope.key).set(newUserData);
					});
					$scope.existedTeam[i].joined=!$scope.existedTeam[i].joined;	
				}
				$scope.requestValid=true;
			});

		}
		
		/*join request flow*/
		/*
			1. add the user email in the  request array in the Team table
			2. add the team id in specific course array of request object in UserAccount table
			3. set the joined variable be true
		*/
		
		$scope.joinRequest=function(index,key)
		{

			$.when($this.requestValidCheck(0,key)).done(function() 
			{
				if($scope.requestValid)
				{
					firebase.database().ref("Team/"+key).once('value', function(data) 
					{
					
						var newTeamData=data.val();
						
						if(typeof(data.val().request)=="undefined")
						{
							var request=[];
							request.push($scope.email);
							newTeamData.request=request;
						}
						else
						{
							newTeamData.request.push($scope.email);
						}
						firebase.database().ref("Team/"+key).set(newTeamData);
					});

					firebase.database().ref("UserAccount/"+$scope.key).once('value', function(data)
					{
						var newUserData=data.val();

						if(typeof(data.val().request)=="undefined")
						{
							var request={};
							var teamArray=[];
							teamArray.push(key);
							request[$scope.currCourse.key]=teamArray;
							newUserData.request=request;
						
						}else
						{					
							if(typeof(newUserData.request[$scope.ckey])=="undefined")
							{
								newUserData.request[$scope.ckey]=[];
							}
							newUserData.request[$scope.ckey].push(key);
						}

						firebase.database().ref("UserAccount/"+$scope.key).set(newUserData);
						$scope.existedTeam[index].joined=!$scope.existedTeam[index].joined;
					});
			
				}
				$scope.requestValid=true;
			});
			
		}
		
		//function for cutting the parameter from url
		//eg. gup( 'c', 'www.123.com?c=aaa'  ) will return 'aaa'

		$this.gup=function( name, url ) {
			if (!url) url = location.href;
			name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
			var regexS = "[\\?&]"+name+"=([^&#]*)";
			var regex = new RegExp( regexS );
			var results = regex.exec( url );
			return results == null ? null : results[1];
		}

		//redirect the page if the course key on url is invalid
		//redirect the page if the user has a team in this course already
		//load the basic info of this course
		$this.loadcoursesInfo=function ()
		{
			
			$scope.ckey=$this.gup('c', window.location.href);
			
			if($scope.ckey==null||$scope.ckey=="")
			{
				$window.location.href="index.html";		
			}
			else
			{
				if(typeof($scope.team)!="undefined"&&$scope.team.hasOwnProperty($scope.ckey))
				{
					$window.location.href="teamPanel.html?c="+$scope.ckey;			
				}
				else
				{
					firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) {
						if(data.val()==null)
						{
							console.log("invalid input of course id");
							$window.location.href="index.html";
						}
						else
						{
							$scope.currCourse=data.val();
							$scope.currCourse.key=data.getKey();
							$this.loadExistedTeam();							
						}
					});
				}

			}

		}
		
		//load the created team
		 $this.loadExistedTeam=function()
		{
			var tmpTeam=[];
			
			firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) {
				
				if(typeof(data.val().team)!="undefined")
				{
					
					for(i=0;i<data.val().team.length;i++)
					{			
						
						firebase.database().ref("Team/"+data.val().team[i]).once('value', function(data) {
							if(typeof(data.val().request)!="undefined")
							{
								if(data.val().request.indexOf($scope.email)>-1)//if current user's email is in team request array, mark it as joined
								{		
									tmpTeam.push({"key":data.getKey(),"data":data.val(),"joined":true});		
								}
								else
								{
									tmpTeam.push({"key":data.getKey(),"data":data.val(),"joined":false});	
								}
							}
							else
							{
								tmpTeam.push({"key":data.getKey(),"data":data.val(),"joined":false});	
							}							
						});
	
					}
					$scope.existedTeam=tmpTeam;
				}
	
			});
	
		}
		//call out the team create form
		$scope.createTeamForm=function()
		{
			$("#teamForm").find('input[type="text"]').val('');
			$("#teamForm").find('textarea').val('');
			$.fancybox.open("#teamForm");	
		}
		
		//check if any essentail input is missed on the team create form
		 $this.validCheck=function()
		{
			
			if($scope.newTeam.name.trim()!=""&&$scope.newTeam.description.trim()!="")
			{
				return true;
			}
			return false;
		}
		
		 $this.removeElementFromArrayByValue=function(value,array)
		{
			array.splice(array.indexOf(value), 1);
		}
		
		//delete all the join requests of a course of a user
		 $this.deleteAllJoinRequestFromTeam=function(newUserData)
		{
			for(i=0;i<newUserData.request[$scope.ckey].length;i++)
			{
				firebase.database().ref("Team/"+newUserData.request[$scope.ckey][i]).once('value', function(data) {
					var newTeamData=data.val();
					$this.removeElementFromArrayByValue($scope.email,newTeamData.request);
					firebase.database().ref("Team/"+data.getKey()).set(newTeamData);
				});
			}
			
		}
		/*crate team flow */
		/*
			1.add a new entry in the Team table
			2.add the team key in the specific course array of team object in UserAccount Table
			3.delete all the team id in specific course array of request object in UserAccount Table ie. the waiting join request
			4.add the key id in team array in courses table
		*/
		$scope.createTeam=function()
		{
			if($this.validCheck())
			{

				$scope.newTeam.leaderID=$scope.email;
				$scope.newTeam.member.push($scope.email);
				$scope.newTeam.courseID=$scope.currCourse.key;

				$scope.teamInfo.$add($scope.newTeam).then(function(data)
				{
					var teamKey=data.getKey();
					
					userAccount.orderByChild("email").equalTo($scope.email).on("child_added", function(data)
					{
						var newUserData=data.val();
						if(typeof(newUserData.team)=="undefined")
						{
							newUserData.team={};
						}
						newUserData.team[$scope.ckey]=teamKey;
						if(typeof(newUserData.request)!="undefined"&&typeof(newUserData.request[$scope.ckey])!="undefined")
						{
							$.when($this.deleteAllJoinRequestFromTeam(newUserData)).done(function() 
							{
								delete newUserData.request[$scope.ckey]
								if(jQuery.isEmptyObject(newUserData.request))
								{
									delete newUserData["request"];
								}
								firebase.database().ref("UserAccount/"+$scope.key).set(newUserData);
							});
						}
						else
						{
							firebase.database().ref("UserAccount/"+$scope.key).set(newUserData);
						}
	
						
						firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) {
						
							var newCourseData=data.val();
							if(typeof(newCourseData.team)=="undefined")
							{
								newCourseData.team=[];
							}
							newCourseData.team.push(teamKey);
							firebase.database().ref("courses/"+$scope.ckey).set(newCourseData);
						}).then(function(){
						
						$window.location.href="teamPanel.html?c="+$scope.ckey;
					});

					});

	
				});
			}
			else
			{
				console.log("some data missed");
			}
			
		}
				
});



app.controller("teamPanelCtrl", function($scope,$rootScope,user,$firebaseArray,$window) {
		$this=this;
		/*initialzation and checking*/
		var courses = firebase.database().ref("courses");
		$scope.courseFB=$firebaseArray(courses);
		
		var team = firebase.database().ref("Team");
		$scope.teamFB=$firebaseArray(team);
		
		var userAccount = firebase.database().ref("UserAccount");
		$scope.userAccount = $firebaseArray(userAccount);

	
		$scope.updateRole=function()
		{
			$scope.email=user.email;
			$scope.role=user.role;
			$scope.userName=user.userName;
			$scope.key=user.key;
			$scope.course=user.course;
			$scope.team=user.team;
		}
	
		$scope.currCourse={};		
		$scope.joinedTeam={};
		$scope.teamMember=[];
		$scope.waitingList=[];
		$scope.lastestTeamMember=[];
		$scope.lastestWaitingList=[];
		$scope.ckey;
		
		$rootScope.$on("updateRole", function(){
			   $scope.updateRole();
			   $this.loadcoursesInfo();
			   
		});
		

		/*quit team flow*/
		/*
			1.delete the user email for the team array in Team table
			2.delete the entry with the course id (key) in team object in UserAccount table
		*/
		$scope.quitTeam=function()
		{
			firebase.database().ref("Team/"+$scope.joinedTeam.key).once('value', function(data) 
			{
				var newTeamData=data.val();		
				$this.removeElementFromArrayByValue($scope.email,newTeamData.member);
				firebase.database().ref("Team/"+$scope.joinedTeam.key).set(newTeamData);
			});
			userAccount.orderByChild("email").equalTo($scope.email).on("child_added", function(data)
			{
				var newUserData=data.val();	
				delete newUserData.team[$scope.ckey];
				if(jQuery.isEmptyObject(newUserData.team))
				{
					delete newUserData["team"];
				}
				firebase.database().ref("UserAccount/"+data.getKey()).set(newUserData).then(function()
				{		
					$window.location.href="index.html";		
				});
			});
			
		}
		//delete all the data that related to the team waiting request
		$this.deleteAllWaitingList=function()
		{
			
			if(typeof($scope.lastestWaitingList)!="undefined")
			{
				
				for(i=0;i<$scope.lastestWaitingList.length;i++)
				{
					var email=$scope.lastestWaitingList[i];
					userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
					{
						$scope.requestHandler(1,1,email,data.getKey());
					});
				}
			}
		
		}
		
		 $this.deleteAllTeamMember=function()
		{
			for(i=0;i<$scope.lastestTeamMember.length;i++)
			{
				var email=$scope.lastestTeamMember[i];
				userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
				{
					$scope.deleteMember(1,email,data.getKey());
				});
			}
		}
		
		$scope.deleteTeam=function()
		{

			firebase.database().ref("Team/"+$scope.joinedTeam.key).once('value', function(data) {


				for(i=0;i<data.val().member.length;i++)
				{
					$scope.lastestTeamMember.push(data.val().member[i]);
				}
				if(typeof(data.val().request)!="undefined")
				{
					for(i=0;i<data.val().request.length;i++)
					{
						$scope.lastestWaitingList.push(data.val().request[i]);
					}
				}

			}).then(function(){
				
				
				$.when($this.deleteAllTeamMember()).done(function(){
					$.when($this.deleteAllWaitingList()).done(function() 
					{
						firebase.database().ref("Team/"+$scope.joinedTeam.key).remove();
						firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) 
						{
							var newCourseData=data.val();		
							$this.removeElementFromArrayByValue($scope.joinedTeam.key,newCourseData.team);
							firebase.database().ref("courses/"+$scope.ckey).set(newCourseData);
						}).then(function(){
							$window.location.href="index.html";		
						}); 
					});

				});
				
		
			});
			
		}
		
		$scope.deleteMember=function(operation,email,memberID)
		{

			if(operation==0&&$scope.joinedTeam.leaderID==email)
			{
				alert("you can't delete the owner")
			}
			else
			{
				if(operation==0)
				{
					firebase.database().ref("Team/"+$scope.joinedTeam.key).once('value', function(data) 
					{
						var newTeamData=data.val();		
						$this.removeElementFromArrayByValue(email,newTeamData.member);
						firebase.database().ref("Team/"+$scope.joinedTeam.key).set(newTeamData);
					});
				}

				firebase.database().ref("UserAccount/"+memberID).once('value', function(data) 
				{
					var newUserData=data.val();
					delete newUserData.team[$scope.ckey];
											
					if(jQuery.isEmptyObject(newUserData.team))
					{
						delete newUserData["team"];
					}
					
					firebase.database().ref("UserAccount/"+memberID).set(newUserData);
					
				});	
				if(operation==0)
				{
					$this.removeUserList($scope.teamMember,memberID);
				}
				
			}

		}
		
		$scope.requestHandler=function(operation,type,email,waitingID)
		{
				
			firebase.database().ref("Team/"+$scope.joinedTeam.key).once('value', function(data) 
			{
				var newTeamData=data.val();		
				console.log("newTeamData ",newTeamData);
				firebase.database().ref("courses/"+$scope.ckey).once('value', function(data)
				{
				
					if(operation==0)
					{
						console.log("accept");									
						var maxSize=data.val().max;
						$scope.currCourse.max=maxSize;
						var memberNumber=newTeamData.member.length;
						if(memberNumber+1<=maxSize)
						{
	
							newTeamData.request.splice(newTeamData.request.indexOf(email), 1);
							newTeamData.member.push(email);
							firebase.database().ref("Team/"+$scope.joinedTeam.key).set(newTeamData);


							firebase.database().ref("UserAccount/"+waitingID).once('value', function(data) 
							{
								var newUserData=data.val();
								$this.removeElementFromArrayByValue($scope.joinedTeam.key,newUserData.request[$scope.ckey]);
								if(typeof(newUserData.team)=="undefined")
								{
									newUserData.team={};
								}
								newUserData.team[$scope.ckey]=$scope.joinedTeam.key
								
								
								if(typeof(newUserData.request!="undefined"))
								{
									console.log(newUserData.request);
									for(i=0;i<newUserData.request[$scope.ckey].length;i++)
									{
										firebase.database().ref("Team/"+newUserData.request[$scope.ckey][i]).once('value', function(data) {

											var newTeamData=data.val();
											$this.removeElementFromArrayByValue(newUserData.email,newTeamData.request);
											firebase.database().ref("Team/"+data.getKey()).set(newTeamData);
											
										});
									}
								}
								delete newUserData.request[$scope.ckey];
								if(jQuery.isEmptyObject(newUserData.request))
								{
									delete newUserData["request"];
								}
								firebase.database().ref("UserAccount/"+waitingID).set(newUserData);
							});				

						}
						else
						{
							alert("exceed max limitation");
						}

						
						$this.updateUserList(newTeamData);
							
					}
					else
					{
						console.log("Decline");

						$this.removeElementFromArrayByValue(email,newTeamData.request);
						firebase.database().ref("Team/"+$scope.joinedTeam.key).set(newTeamData);				
						
						firebase.database().ref("UserAccount/"+waitingID).once('value', function(data) 
						{
							var newUserData=data.val();		
							$this.removeElementFromArrayByValue($scope.joinedTeam.key,newUserData.request[$scope.ckey]);
							firebase.database().ref("UserAccount/"+waitingID).set(newUserData);
						});

						if(type==0)
						{
							$this.updateUserList(newTeamData);
						}

					}
				});
			});
		}
		

		$this.updateUserList=function(newTeamData)
		{
			var tmpMember=[];
			var tmpWaiting=[];
			for(i=0;i<newTeamData.member.length;i++)
			{
				$this.userObjectArrayPush(newTeamData.member[i],tmpMember);
			}
			$scope.teamMember=tmpMember;
			if(typeof(newTeamData.request.length)!="undefined")
			{
				for(i=0;i<newTeamData.request.length;i++)
				{
					$this.userObjectArrayPush(newTeamData.request[i],tmpWaiting);
				}
			}

			$scope.waitingList=tmpWaiting;
		}
		
		 $this.removeUserList=function(array,userID)
		{
			for(i=0;i<array.length;i++)
			{
				if(array[i].key==userID)
				{
					array.splice(i, 1);
					break;
				}
			}
		}
		
		
		 $this.removeElementFromArrayByValue=function(value,array)
		{
			array.splice(array.indexOf(value), 1);
		}
		
		 $this.userObjectArrayPush=function(email,array)
		{
			userAccount.orderByChild("email").equalTo(email).on("child_added", function(data)
			{
				array.push({"key":data.getKey(),"data":data.val()});
			});
				
		}
		
		
		 $this.renderTeamInfo=function()
		{
			firebase.database().ref("Team/"+$scope.team[$scope.ckey]).once('value', function(data) {
	
				$scope.joinedTeam=data.val();
				$scope.joinedTeam.key=data.getKey();
				if($scope.joinedTeam.leaderID==$scope.email)
				{
					$scope.isOwner=true;
				}
				else
				{
					$scope.isOwner=false;
				}
				
				
				for(i=0;i<$scope.joinedTeam.member.length;i++)
				{
					
					$this.userObjectArrayPush($scope.joinedTeam.member[i],$scope.teamMember);
				}
				if(typeof($scope.joinedTeam.request)!="undefined")
				{
					for(i=0;i<$scope.joinedTeam.request.length;i++)
					{

						$this.userObjectArrayPush($scope.joinedTeam.request[i],$scope.waitingList);
					}
				}

				
			});
			
		}
		
		 $this.roleAccessCheck=function()
		{
			if($scope.role=="0")
			{
				if(typeof($scope.team)=="undefined"||!$scope.team.hasOwnProperty($scope.currCourse.key) )
				{
					console.log("no team in this course");
					$window.location.href="index.html";
				}
				$this.renderTeamInfo();
			}
			else
			{
				if($scope.currCourse.owner!=$scope.email)
				{
					console.log("you are teacher but not the course owner");
					$window.location.href="index.html";
				}
			}
		
		}

		$this.gup=function( name, url ) {
			if (!url) url = location.href;
			name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
			var regexS = "[\\?&]"+name+"=([^&#]*)";
			var regex = new RegExp( regexS );
			var results = regex.exec( url );
			return results == null ? null : results[1];
		}

		
		 $this.loadcoursesInfo=function()
		{
			$scope.ckey=$this.gup('c', window.location.href);
			
			if($scope.ckey==null||$scope.ckey=="")
			{
				$window.location.href="index.html";		
			}
			else
			{
				firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) {
					if(data.val()==null)
					{
						console.log("invalid input of course id");
						$window.location.href="index.html";
					}
					else
					{
						$scope.currCourse=data.val();
						$scope.currCourse.key=data.getKey();
						$this.roleAccessCheck();						
					}
				});

			}

		}
		
		/**********************************teacher update info********************************************************/
		
				
		File.prototype.convertToBase64 = function(callback){
			var reader = new FileReader();
			reader.onload = function(e) {
				 callback(e.target.result)
			};
			reader.onerror = function(e) {
				 callback(null);
			};        
			reader.readAsDataURL(this);
		};
		
		$scope.fileNameChanged = function (ele) 
		{
		  var file = ele.files[0];
		  if(file.type.length>0&&file.type.substr(0,5)=="image")
		  {
				file.convertToBase64(function(base64){
				$scope.courseInfo.image=base64;
				$scope.fileName=file.name;
				$('#base64PicURL').attr('src',base64);
				$('#base64Name').html(file.name);
				$('#removeURL').show();
				$('#profilePic').val('');
			}); 
			  	  
		  }
		  else
		  {
			  alert("invliad file format");
			//  $scope.removeImg();
			  $('#profilePic').val('');
		  }


		}
		
		$scope.courseInfo=
		{
			title:"",
			image:"",
			owner:"",
			message:"",
			max:"",
			min:"",
			date:""
		}
		$scope.fileName;
		
		$scope.removeImg=function(){
		
			$('#removeURL').hide();
			$('#base64Name').html('');
			$scope.courseInfo.image='image/grey.png';
			$scope.fileName='';
			$('#base64PicURL').attr('src','');

		}
		
		$this.validInput=function ()
		{
			$scope.courseInfo.title=$scope.currCourse.title;
			$scope.courseInfo.message=$scope.currCourse.message;
			$scope.courseInfo.max=$scope.currCourse.max;
			$scope.courseInfo.min=$scope.currCourse.min;
			$scope.courseInfo.date=$scope.currCourse.date;
			$scope.courseInfo.owner=$scope.email;
			if(typeof($scope.courseInfo.image)=="undefined"||$scope.courseInfo.image=="")
			{
				$scope.courseInfo.image='image/grey.png';
			}
			
			if(typeof($scope.courseInfo.title)=="undefined"||typeof($scope.courseInfo.message)=="undefined")
			{
				alert("some missing data");
				return false;
			}
			return true;	
		}
		
		$scope.editCourse = function() {

			if($this.validInput())
			{
				firebase.database().ref("courses/"+$scope.ckey).once('value', function(data) 
				{
					if(typeof(data.val().team)!="undefined")
					{
						$scope.courseInfo.team=data.val().team;
					}
					
					firebase.database().ref("courses/"+$scope.ckey).set($scope.courseInfo).then(function(){
						
						$window.location.href="index.html";		
						
					});
				});
			
			}else
			{
				alert("some missing data");
			}

		}
		
});


app.controller("myProfileCtrl", function($scope,$rootScope,user, $firebaseArray) {
		$this=this;
		/*initialzation and checking*/
		var userAccount = firebase.database().ref("UserAccount");
		$scope.userAccount = $firebaseArray(userAccount);
		
		
		$scope.updateRole=function()
		{
			$scope.email=user.email;
			$scope.role=user.role;
			$scope.userName=user.userName;
			$scope.key=user.key;
		}
	
		$rootScope.$on("updateRole", function(){
			$scope.updateRole();
		    $scope.loadUserData();
		    $this.initTagList();
		    $this.initAutoComplete();
		});
		
		$scope.currUser;
		$scope.password;

		$scope.defaultTags=[];
		$scope.addedTags;

		
		 $this.removeElementFromArrayByValue=function(value,array)
		{
			array.splice(array.indexOf(value), 1);
		}
		
		$scope.removeTag=function(tag)
		{
			$this.removeElementFromArrayByValue(tag,$scope.addedTags);
		}

		
		$scope.addTag=function()
		{
			
			var tmpTag=$('#autoComplete').val();
			
			if(typeof(tmpTag)=="undefined"||tmpTag.trim()=="")
			{
				alert("you should enter a valid tag");
				return;
			}
			
			if(typeof($scope.addedTags)=="undefined")
			{
				$scope.addedTags=[];
				$scope.addedTags.push(tmpTag);
			}
			else
			{
				if($scope.addedTags.indexOf(tmpTag.trim())>-1)
				{
					alert("you have adde this tag already");
						return;
				}
				else
				{
					$scope.addedTags.push(tmpTag);
				}		
			}
			$('#autoComplete').val('');
			
		}
		
		$this.initTagList=function ()
		{
			$.getJSON('tags.json', function(data) {
				
				$scope.defaultTags=data.data;
				for(var i=0;i<$scope.defaultTags.length;i++)
				{
					
					$scope.defaultTags[i]=$scope.defaultTags[i]+" ";
				}	
			});

			
		}
		$this.initAutoComplete=function ()
		{
			$( "#autoComplete" ).autocomplete({

				source: function(request, response) {
					var results = $.ui.autocomplete.filter($scope.defaultTags, request.term);
					for(var i=0;i<results.length;i++)
					{
						results[i]=results[i].trim();
					}
					response(results.slice(0, 10));
				}  
				
			}).focus(function() {

				$(this).autocomplete("search"," ");
				$(this).autocomplete( "option", "minLength", 0 );
			});;
		}
		
		$scope.loadUserData=function()
		{
			firebase.database().ref("UserAccount/"+$scope.key).once('value', function(data) 
			{
				$scope.currUser=data.val();	
				$scope.addedTags=data.val().tags;	
			});
			
		}

		$this.validInput=function()
		{
			if(typeof($scope.currUser.userName)=="undefined"||$scope.currUser.userName.trim()=="")
			{
				alert("some data missed");
				return false;
			}
			if(typeof($scope.password)!="undefined"&&$scope.password!="")
			{
				var user = firebase.auth().currentUser;
				user.updatePassword($scope.password).then(function() {
				}, function(error) 
				{
					alert(error);
					return false;
				});
			}
			return true;
		}

		$scope.editProfile=function()
		{
			if($this.validInput())
			{
				firebase.database().ref("UserAccount/"+$scope.key).once('value', function(data) 
				{
					var newUserData=data.val(); 
					newUserData.userName=$scope.currUser.userName; 
					if(typeof($scope.addedTags)!="undefined")
					{
						newUserData.tags=$scope.addedTags;
					}
					else
					{
						if(newUserData.hasOwnProperty['tags'])
						{
							delete newUserData['tags'];
						}
					}
					firebase.database().ref("UserAccount/"+$scope.key).set(newUserData).then(function(){
						user.userName=$scope.currUser.userName;
						
						$rootScope.$emit("updataEmailCall", {});		
						alert("success");
						
					});
				});
			}
		}
		
		
	});