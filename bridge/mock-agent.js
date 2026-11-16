// Fake PhoneBox agent on :8765 so the bridge can be tested without PhoneBox.
var http=require('http'),items=[{id:'ab12cd34ef56',tool:'Bash',project:'demo',detail:'rm -rf build/',createdAt:Date.now(),expiresAt:Date.now()+60000}];
http.createServer(function(q,r){var u=require('url').parse(q.url,true),m;r.setHeader('Content-Type','application/json');
 if(u.pathname==='/api/state')return r.end('{}');
 if(u.pathname==='/api/approvals'&&q.method==='GET')return r.end(JSON.stringify({items:items}));
 if(m=/^\/api\/approvals\/(\w+)$/.exec(u.pathname)){items=items.filter(function(a){return a.id!==m[1]});console.log('decision',m[1],u.query.decision);return r.end('{}')}
 if(u.pathname==='/api/quotas')return r.end(JSON.stringify({providers:[{id:'claude',name:'Claude',plan:'Max',limits:[{label:'5h',percent:42},{label:'Week',percent:78}]}]}));
 r.statusCode=404;r.end('{}')}).listen(8765,'127.0.0.1');
