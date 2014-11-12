
 /* Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var ejemplo;
var estado;
var imagenBombilla;
var dominio = "http://raspberrypilights.ddns.net";
var usuario;

document.addEventListener("deviceready", onDeviceReady, false);
/*document.addEventListener('volumeupbutton', encenderLuces(), false);
document.addEventListener('volumedownbutton', apagarLuces(), false);*/

function onDeviceReady() {

    var imagenGoogle = $('<img />', {
                        id: 'imagenGoogle',
                        class: 'imagenGoogle',
                        src: 'img/recursos/google.png'});

   
    estado = false;

    var url = dominio + "/luces/estado";
    
    var imagenBombilla = $('<img />',
             { id: 'imagenBombilla',
               src: 'img/recursos/cargando1.gif'}).appendTo($('#divImagenBombilla'));


    $.getJSON(url, function( data ) {
        $.each( data, function( key, val ) {
            estado = val;
            switch(estado){
                case true:
                    $('#imagenBombilla')[0].src = "img/recursos/bombilla_encendida.png"; 
                break;
                case false:
                    $('#imagenBombilla')[0].src = "img/recursos/bombilla_apagada.png";
                break;
            }
        });
    });
    
    $('#imagenBombilla').click(function(e){
        switch(estado){
            case true:
            apagarLuces(); 
            break;
            case false:
            encenderLuces();
            break;
        }
    });

     $('#identificate').click(function(e){
        googleapi.authorize({
            client_id: '352839649794-48vvroe4jnegqrfspd0m4tdq7bjqp9po.apps.googleusercontent.com',
            redirect_uri: 'http://localhost',
            scope: 'profile openid'
        }).done(function(data) {

            $.ajax({
                url: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + data.access_token,
                data: null,
                success: function(resp) {
                    user    =   resp;
                    usuario = user.name;
                    $('#imagenGoogle')[0].src = user.picture;
                    
                },
                dataType: "jsonp"
            });

        }).fail(function(data) {
            //$loginStatus.html(data.error);
        });

    });
};


function encenderLuces(){

    var privilegio;
    $.post(dominio + "/luces/accion",{
        estado:"encender",
        usuario: usuario
    }, function(data){
        if(data.permisos == "ADMINISTRADOR"){
            privilegio = true;
        }else{
            privilegio = false;
        }
    }).done(function(){
        if(privilegio == true){
            $('#imagenBombilla')[0].src = "img/recursos/bombilla_encendida.png";
            estado = true;  
        }
    }).fail(function(){
        alert("Fallo al conectar al servidor");
    });
};

function apagarLuces(){
    
    var privilegio;
    $.post(dominio + "/luces/accion",{
          estado:"apagar",
          usuario: usuario
    }, function(data){
        if(data.permisos == "ADMINISTRADOR"){
            privilegio = true;
        }else{
            privilegio = false;
        }
    }).done(function(){
        if(privilegio == true){
            $('#imagenBombilla')[0].src = "img/recursos/bombilla_apagada.png";  
            estado = false;
        }
    }).fail(function(){
        alert("Fallo al conectar al servidor");
    });
};





var googleapi = {
    authorize: function(options) {
        var deferred = $.Deferred();

        //Build the OAuth consent page URL
        var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + $.param({
            client_id: options.client_id,
            redirect_uri: options.redirect_uri,
            response_type: 'code',
            scope: options.scope
        });

        //Open the OAuth consent page in the InAppBrowser
        var authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=no');

        //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
        //which sets the authorization code in the browser's title. However, we can't
        //access the title of the InAppBrowser.
        //
        //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
        //authorization code will get set in the url. We can access the url in the
        //loadstart and loadstop events. So if we bind the loadstart event, we can
        //find the authorization code and close the InAppBrowser after the user
        //has granted us access to their data.
        $(authWindow).on('loadstart', function(e) {
            var url = e.originalEvent.url;
            var code = /\?code=(.+)$/.exec(url);
            var error = /\?error=(.+)$/.exec(url);



            if (code || error) {
                //Always close the browser when match is found
                authWindow.close();
            }

            if (code) {
                var codeNew=code[1];
                var n = codeNew.indexOf('&');
                codeNew = codeNew.substring(0, n != -1 ? n : codeNew.length);
                //Exchange the authorization code for an access token
                $.post('https://accounts.google.com/o/oauth2/token', {
                    code: codeNew,
                    client_id: options.client_id,
                    client_secret: options.client_secret,
                    redirect_uri: options.redirect_uri,
                    grant_type: 'authorization_code'
                }).done(function(data) {
                    
                    deferred.resolve(data);
                }).fail(function(response) {
                    deferred.reject(response.responseJSON);
                });
            } else if (error) {
                //The user denied access to the app
                deferred.reject({
                    error: error[1]
                });
            }
        });

        return deferred.promise();
    }
};