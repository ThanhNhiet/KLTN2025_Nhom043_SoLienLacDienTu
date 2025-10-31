const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define ChatType enum
const ChatType = {
  PRIVATE: 'private',
  GROUP: 'group'
};

// Define MemberRole enum
const MemberRole = {
  ADMIN: 'admin',
  LECTURER: 'lecturer',
  MEMBER: 'member'
};

// Subdocument schema for members
const memberSchema = new Schema({
  userID: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(MemberRole),
    default: MemberRole.MEMBER
  },
  avatar: {
    type: String,
    default: null
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  muted: {
    type: Boolean,
    default: false
  },
  lastReadAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Define the Chat schema
const chatSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  course_section_id: {
    type: String,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(ChatType),
    required: true
  },
  name: {
    type: String,
    required: function() {
      return this.type === ChatType.GROUP;
    }
  },
  avatar: String,
  createdBy: String,
  updatedBy: String,
  members: [memberSchema],   // embedded members array
}, {
  timestamps: true
});

// Composite index: ensure a user appears once per chat
chatSchema.index({ _id: 1, "members.userID": 1 }, { unique: true });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = {
  Chat,
  ChatType,
  MemberRole
};
