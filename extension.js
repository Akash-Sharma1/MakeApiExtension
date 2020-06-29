const vscode = require('vscode');
const cp = require('child_process');
const { default: axios } = require('axios');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('make-api-extension.getproject', function () {
		
		let folderPath = vscode.workspace.rootPath; 
		
		var username = await vscode.window.showInputBox({ placeHolder: 'username' });
		var password = await vscode.window.showInputBox({ placeHolder: 'password' });
		var ProjectName = await vscode.window.showInputBox({ placeHolder: 'project name' });
		
		
		var urls_py = "";
		var models_py = "";
		var views_py = "";
		
		let ProjectPath = folderPath +'/'+ ProjectName;
		
		var Data = {
			"username" : username,
			"password" : password,
			"projectName" : ProjectName
		}
		console.log(Data);
		return;
		
		var setting_urls_py = `
from django.contrib import admin
from django.urls import path, include #new

urlpatterns = [
\tpath('admin/', admin.site.urls),
\tpath('', include('app.urls')), #new
]`

	var readme_text = `>> pip install virtualenvwrapper-win
>> mkvirtualenv {anyenvname}
>> workon {envname}
>> cd {projectname}
>> python manage.py makemigrations app
>> python manage.py migrate
>> python manage.py runserver
`
		
		axios.post('https://makeapibackend.herokuapp.com/getproject', Data)
       	.then(response => {
			console.log(response);
			if(response.data.toString() == 'User does not exist'){
				vscode.window.showErrorMessage("Username/Password not found");
				return;
			}
			if(response.data.Boxes.length == 0){
				vscode.window.showErrorMessage("No project Found");
				return;
			}
			response = response.data.Boxes[0];
			urls_py = response.urls;
			models_py = response.tables;
			views_py = response.views;
			installDjango(); 
		}).catch(response =>{
			console.log(response);
		})

		function installDjango(){
			vscode.window.showInformationMessage('Installing Django');
			cp.exec('pip install Django', {cwd: folderPath }, (err, stdout) => {
				if (err) {
					vscode.window.showErrorMessage(err.toString());
				}
				else{
					startproject();
					// console.log('stdout: ' + stdout);
				}
			});
		}
		function startproject(){
			vscode.window.showInformationMessage('Making Django project');
			cp.exec('django-admin startproject '+ ProjectName, {cwd: folderPath}, (err, stdout) => {
				if (err) {
					vscode.window.showErrorMessage(err.toString());
				}
				else{
					startapp();
				}
			});
		}
		function startapp(){
			vscode.window.showInformationMessage('Making app');
			cp.exec('python manage.py startapp app ',  {cwd: ProjectPath}, (err, stdout, stderr) => {
				if (err) {
					vscode.window.showErrorMessage(err.toString());
				}
				else{
					writefiles();
				}
			});
		}
		function writefiles(){
			write(views_py , ProjectPath+'/app/views.py' , 'views.py')
			write(urls_py , ProjectPath+'/app/urls.py' , 'urls.py')
			write(models_py , ProjectPath+'/app/models.py' , 'models.py')
			
			write(readme_text , ProjectPath+'/Readme.txt' , 'Readme.txt' ); 
			write(setting_urls_py, ProjectPath + '/' + ProjectName +'/urls.py' , 'urls.py' )
			altersettings_py();
			vscode.window.showInformationMessage('Done! you can run server now.');
		}
		function altersettings_py(){
			fs.readFile(ProjectPath + '/' + ProjectName +'/settings.py' , 'utf8', function(err, data){ 
				var idx = data.indexOf("'django.contrib.admin',");
				var newdata = data.substring(0,idx);
				newdata += "'app.apps.AppConfig',\n\t";
				newdata += data.substring(idx, data.length);
				// console.log(data);
				write(newdata , ProjectPath + '/' + ProjectName +'/settings.py' , 'settings.py' ); 
			}); 
		}
		function write(data, path,filename){
			fs.writeFile(path, data, (err) => {
				if (err) throw err;
				// else vscode.window.showInformationMessage('Writing '+filename);
			  });
		}

		
		vscode.window.showInformationMessage('Process started');
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
