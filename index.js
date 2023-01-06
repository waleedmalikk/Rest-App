const express = require('express');

const db = require('./database')

const app = express();

app.use(express.json());

const User = require('./User')

db.authenticate().then(() => console.log("db connected"))
.catch(err =>console.log("error:" + err))

async function getUsers(){
const users=  await User.findAll();
return users
}

async function registerUser(uemail,upass,uphone,uname){
    const user=  await User.create({
        email:uemail,
        password:upass,
        phone:uphone,
        name:uname
    },  {fields:['email',"password","phone","name"]} );
    return user
}

async function searchUser(uname, upassword){
    const user = await User.findAll({
        where:{
            name:uname,
            password:upassword
        }
    })
    return user
}

async function searchUserU(uname){
    const user = await User.findAll({
        where:{
            name:uname
        }
    })
    return user
}

async function updateUser(upass, uname){
    const user = await User.update({password:upass},  {where:{name:uname}} )
    return user
}

app.get('/api/users', async (req, res) => {
users = await getUsers()
res.send(users)
} )

app.get('/api/users/:name/:password', async (req, res) => {
user = await searchUser(req.params.name, req.params.password)

if(user.length>0){ 
    res.send(user[0].dataValues)
}else{
    res.send("user not found!")
}

})

app.post('/api/users/', async (req,res) => {
user = await registerUser(req.body.email,req.body.password,req.body.phone,req.body.name)

res.send(user)

})

app.put('/api/users', async(req,res) => {
user = await searchUserU(req.body.name)

if(user.length<1){
    res.send('user not found')
}

userUpdated = await updateUser(req.body.password,req.body.name)

res.send(user)
    
})

// const PORT = process.env.PORT || 3000
const PORT = 3000
app.listen(PORT, () => console.log(`listening on port ${PORT}`))