var main = function()
{
	var info = {email:'Sujay.Ananthakrishna@causeway.com',password:'Causeway123'};
	var sessionID = null;	
	
	Livestax.title("Test title");
	Livestax.flash.info("This is a info flash message");
	
	var data = {
	title: "Test Dialog",
	message: "This is a test dialog",
	buttons: [
		{
		  title: "Okay",
		  callback: function(){},
		  type: "ok"
		}
		]
	};
	Livestax.dialog.show(data);
	
	$.ajax({
    url: 'https://dreamfactory.causeway.com/rest/user/session',
    type: 'post',
    data: JSON.stringify(info),
    headers: {
        'X-DreamFactory-Application-Name': 'CATO'
    },
    dataType: 'json',
    success: function (data) 
	{
        var sessionID = data["session_id"];
		
			$.ajax({
			//url:'https://dreamfactory.causeway.com/rest/CATO/tblProjects?fields=fldprojectid,fldprojecttitle,fldProjectClassDataID,fldProjectExchangeRate,fldProjectDate',
			url:'https://dreamfactory.causeway.com/rest/CATO-STAX/_proc/sp_getProjects',
			type:'get',
			headers:{
			'X-DreamFactory-Application-Name': 'CATO',
			'X-DreamFactory-Session-Token': sessionID
			},
			datatype:'json',
			success: function(data)
			{
				//alert(data["record"]);
				//var temp = data["record"];
				
				var projList = document.getElementById('projList');
				var alphaList = new Array();
				
				for(var i=0;i<data.length;i++)
				{
					var project = data[i];
					var tmpData = document.getElementById('projectInfo-template').content.cloneNode(true);
					
					var curCat = null;
					
					var tmp = $.inArray(project.ALPHA, alphaList);
					
					if(tmp === -1)
					{
						alphaList.push(project.ALPHA);
						var tmpCat = document.getElementById('projectCat-template').content.cloneNode(true);
						
						tmpCat.querySelector('.prjCat').innerHTML = project.ALPHA;
						projList.appendChild(tmpCat);
					}

					tmpData.querySelector('.list-group-item-heading').innerHTML = project.ProjectTitle;
					tmpData.querySelector('.list-group-item-text').innerHTML = project.Description;
					projList.appendChild(tmpData);
					
				}
			}
		});		
    }});
  
}

$(document).ready(main);