const jwt = require('jsonwebtoken');
const db = require('../models');


class TokenService{
    generateTokens(payload){
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn: '10m'});
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: '15d'});
        return {
            accessToken,
            refreshToken
        }
    }

    validateAccessToken(token){
        try {
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            return userData;
        } catch (error) {
            return null;
        }
    }

    validateRefreshToken(token){
        try {
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            return userData;
        } catch (error) {
            return null;
        }
    }

    async saveToken(userId, refreshToken){
        const tokenData = await db.Token.findOne({where: {user_id: userId}});
        if(tokenData){
            tokenData.refreshToken = refreshToken;
            return tokenData.save();
        }
        const token = await db.Token.create({user_id: userId, refreshToken});
        return token;
    }

    async removeToken(refreshToken){
        const tokenData = await db.Token.destroy({where: {refreshToken: refreshToken}});
        return tokenData;
    }

    async findToken(refreshToken){
        const tokenData = await db.Token.findOne({where: {refreshToken}});
        return tokenData;
    }
}

module.exports = new TokenService();