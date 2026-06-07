const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
    {
      followerId: {
        type: String,
        required: true
      },
      followingId: {
        type: String,
        required: true
      }
    },
    {
      timestamps: true // createdAt et updatedAt
    }
  );

  followSchema.index(
    { followerId: 1, followingId: 1 },
    { unique: true }
  );
  

  const Follow = mongoose.model('Follow', followSchema);
  export default Follow;

  //module.exports = Follow; ne fonctionne pas avec TypeScript
  //