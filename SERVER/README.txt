
1) Criar um ambiente dentro da pasta da app dedicado para estabelecer um servidor que contacte com a base de dados

[VANTAGES: SEGURANÇA E MELHOR GESTÃO DOS DADOS]

TERMINAL (APP SACADA)

mkdir backend
cd backend
npm init -y
npm install express pg body-parser

2) Criar um file dentro da diretoria para estabelecer o servidor

'server.js'

3) Run Your Backend Server

In the terminal, navigate to the backend directory and start your server with:

Terminal -> node server.js

Your backend server will now be running and listening for requests on http://localhost:5432.