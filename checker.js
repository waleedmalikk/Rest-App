const users = [
    {userid:1, email:"user1@gmail.com",password:"12345"},
    {userid:2, email:"user2@gmail.com",password:"23456"},
    {userid:3, email:"user3@gmail.com",password:"34567"}
]


let user = users.find(c =>c.userid=== 1)

console.log(user)