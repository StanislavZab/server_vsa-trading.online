const chartService = require('../service/chart-service');
const {validationResult} = require('express-validator');
const ApiError = require('../exceptions/api-error');


class ChartController{
    async getCandles(req, res, next){
        try {
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }

            const {code, tf, index} = req.body;
            console.log('code:',code,'tf:',tf);
            const userData = await chartService.getCandles(code, tf, index);
            return res.json(userData);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ChartController();