const express = require('express')
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const app = express();
const knex = require('knex')

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'sarmed123',
        database: 'smartbrain'
    }
});



const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(cors())

const database = {
    users: [
        {
            id: '123',
            name: 'sarmedd',
            email: 'sarmedrizvi@gmail.com',
            password: 'cake',
            entries: 0,
            joined: new Date()

        },
        {
            id: '124',
            name: 'sajjad',
            email: 'sajjadrizvi90@gmail.com',
            password: 'apple',
            entries: 0,
            joined: new Date()

        }
    ]
}

app.get('/', (req, res) => {
    db.select('*').from('users')
        .then(users => res.json(users))
        .catch(err => res.status(400).json(err))
})


// Sign In

app.post('/signin', (req, res) => {
    const { email, hash } = req.body;
    db.select('*').from('login').where({ email }).then(user => {
        if (user.length === 0) { res.status(400).json('No such user') }
        else {
            const isvalid = bcrypt.compareSync(hash, user[0].hash)
            if (isvalid) {
                return db.select('*').from('users').where({ email })
                    .then(data => {
                        res.json(data[0])
                    }).catch(err => res.status(400).json('unable to get the user'))
            }
            else {
                res.status(400).json('Wrong Credentials')
            }
        }


    })
        .catch(err => res.status(400).json('Wrong credential'))

})


// Register

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({ hash, email }).into('login')
            .returning('email')
            .then(emailLogin => {
                if (emailLogin.length === 0) {
                    res.status(400).json('Enter details')
                }
                else {
                    return trx('users')
                        .returning('*')
                        .insert(
                            {
                                email: emailLogin[0],
                                name: name,
                                joined: new Date()
                            }
                        ).then(user => { res.json(user[0]) })
                        .catch(err => res.status(400).json('Unable to register'))
                }

            })
            .then(trx.commit)
            .catch(trx.rollback)
    }).catch(err => res.status(400).json(err))
})


// Get User

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db('users').where({ id: id }).select('*').then(user => {
        if (user.length !== 0) { res.json(user[0]) }
        else {
            res.status(400).json("No such error")
        }
    })
        .catch(err => res.status(400).json('Error'))
})

//image

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users')
        .where({ id })
        .increment('entries', 1)
        .returning('entries').then(count => res.json(count[0]))
        .catch(err => res.status(400).json(err))
})

app.listen(3000, () => {
    console.log('app is running on port 3000')
})