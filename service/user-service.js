const db = require('../models');
const { Op } = require('sequelize')
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');

class UserService {
    async registration(email, password){
        const condidate = await db.User.findOne({ where: {email: email} })
   
        if(condidate){
            throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} уже существует`)
        }
        const activationLink = uuid.v4();
        const hashPassword = await bcrypt.hash(password, 3);
     
        const user = await db.User.create({email, password: hashPassword, activationLink})
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}/`);

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto};
    }

    async activate(activationLink){
        const user = await db.User.findOne({where: {activationLink: activationLink}});
        if(!user){
            throw ApiError.BadRequest('Неккоректная ссылка активации!');
        }
        user.isActivated = true;
        return await user.save();
    }

    async login(email, password){
        const user = await db.User.findOne({where: {email: email}});
        if(!user){
            throw ApiError.BadRequest('Пользователь с таким email не найден!');
        }

        const isPassEquals = await bcrypt.compare(password, user.password);
        if(!isPassEquals){
            throw ApiError.BadRequest('Не верная пара email->password');
        }

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto};
    }

    async logout(refreshToken){
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken){
        if(!refreshToken){
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);

        if(!userData || !tokenFromDb){
            throw ApiError.UnauthorizedError();
        }

        const user = await db.User.findByPk(userData.id);
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto};
    }

    async getAllUsers(){
        const users = await db.User.findAll();
        return users;
    }
}

module.exports = new UserService();