'use strict';
const {
  Model,
  Op,
  Sequelize
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Booking.belongsTo(
        models.Spot,
        { foreignKey: 'spotId' }
      )
    }
  }
  Booking.init({
    userId: {
      type: DataTypes.INTEGER,
      references: { model: 'Users' },
      onDelete: 'cascade',
      hooks: true
    },
    spotId: {
      type: DataTypes.INTEGER,
      references: { model: 'Spots' },
      onDelete: 'cascade',
      hooks: true
    },
    startDate: {
      type: DataTypes.DATEONLY,
      validate: {
        // isNotOverlapping: async function(value) {
        //   // Check if the new booking's start date overlaps with any existing bookings for the same spot
        //   const spotId = this.spotId
        //   const existingBookingsStart = await Booking.findAll({
        //     where: {
        //       // spotId,
        //       startDate: { [Op.lte]: this.startDate },
        //       endDate: { [Op.gte]: this.startDate }
        //     }
        //   });
        //   if (existingBookingsStart.length > 0) {
        //     throw new Error('Start date conflicts with an existing booking');
        //   }
        // }
      }
    },
    endDate: {
      type: DataTypes.DATEONLY,
      validate: {
        isAfterStartDate: function(value) {
          // Check that endDate is after startDate and not on it
          if (value <= this.startDate) {
            throw new Error('endDate cannot be on or before startDate');
          }
        },
        // isNotOverlapping: async function(value) {
        //   // Check if the new booking's end date overlaps with any existing bookings for the same spot
        //   const spotId = this.SpotId;
        //   const existingBookingsEnd = await Booking.findAll({
        //     where: {
        //       spotId,
        //       startDate: { [Op.lte]: this.endDate },
        //       endDate: { [Op.gte]: this.endDate }
        //     }
        //   });
        //   if (existingBookingsEnd.length > 0) {
        //     throw new Error('End date conflicts with an existing booking');
        //   }
        // },
        isPast: function(value) {
          if (new Date(value) < new Date()) {
            throw new Error('Cannot edit a booking in the past');
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Booking',
    hooks: {
      beforeCreate: async (booking, options) => {
        try {
          // Check if the new booking's start date overlaps with any existing bookings for the same spot
          const existingBookingsStart = await Booking.findAll({
            where: {
              spotId: booking.spotId,
              startDate: { [Op.lte]: booking.startDate },
              endDate: { [Op.gte]: booking.startDate }
            }
          });
        
          if (existingBookingsStart.length > 0) {
            const errorResponse = {
              message: 'Sorry, this spot is already booked for the specified dates',
              statusCode: 403,
              errors: {
                startDate: 'Start date conflicts with an existing booking'
              }
            };
            
            throw errorResponse;
          }
        
          // Check if the new booking's end date overlaps with any existing bookings for the same spot
          const existingBookingsEnd = await Booking.findAll({
            where: {
              spotId: booking.spotId,
              startDate: { [Op.lte]: booking.endDate },
              endDate: { [Op.gte]: booking.endDate }
            }
          });
        
          if (existingBookingsEnd.length > 0) {
            const errorResponse = {
              message: 'Sorry, this spot is already booked for the specified dates',
              statusCode: 403,
              errors: {
                endDate: 'End date conflicts with an existing booking'
              }
            };
          
            throw errorResponse;
          }
        } catch(error) {
          throw error;
        }
      }
    }        
  });
  return Booking;
};
