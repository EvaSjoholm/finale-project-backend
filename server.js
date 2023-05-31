import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;


// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Start defining your routes here
app.get("/", (req, res) => {
  res.send("Hello Moto");
});


// QUUESTION STRUCTURE 
const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true
  },
});


// OVERALL QUIZ STRUCTURE 
const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  questions: {
    type: [QuestionSchema],
    required: true,
  }
});

const Quiz = mongoose.model("Quiz", QuizSchema);
app.get("/quizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    console.error("Error retrieving quizzes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/quizzes", async (req, res) => {
  try {
  const newQuiz = await new Quiz(req.body).save()
    res.status(201).json({
      success: true,
      response: newQuiz,
      message: "Created successfully"
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e,
      message: "Could not save"
    });
  }
});


// FOR THE USER 
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minLength: 2,
    maxLength: 30
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  }
});

const User = mongoose.model("User", UserSchema);


// REGISTER NEW USER FOR SIGN UP
app.post("/register", async (req, res) => {
  const {username, password} = req.body;

  try {
const salt = bcrypt.genSaltSync();
const newUser = await new User({
  username: username,
  password: bcrypt.hashSync(password, salt)
}).save();
res.status(201).json({
  success: true,
  response: {
    username: newUser.username,
    id: newUser._id,
    accessToken: newUser.accessToken
  }
})
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e,
      message: "Could not create user"
    })
  }
});

// //LOGIN FOR USER IF BECOMING A MEMBER 
// app.post("/login", async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     const user = await User.findOne({username: username})
//     if (user && bcrypt.compareSync(password, user.password)) {
//       res.status(200).json({
//         success: true,
//         response: {
//           username: user.username,
//           id: user._id,
//           accessToken: user.accessToken,
//           message: "Login successful"
//         }
//       });
//     } else {
//       res.status(400).json({
//         success: false,
//         response: "Credentials do not match"
//       });
//     }
//   } catch (e) {
//     res.status(500).json({
//       success: false,
//       response: e
//     });
//   }
// });


// WHEN USER BECOMES A WORKOUT MEMBER 
const MemberSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 150
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  username: {
    type: String,
    required: true
  }
});



const Member = mongoose.model("Members", MemberSchema);

// AUTHENTICATE THE MEMBER/USER 
const authenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({accessToken: accessToken});
    if (user) {
      next();
    } else {
      res.status(401).json({
        success: false,
        response: "Please log in",
        loggedOut: true
      })
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e
    });
  }
}

app.get("/members", authenticateUser);
app.get("/members", async (req, res) => {
  try {
    const accessToken = req.header("Authorization");
    const user = await User.findOne({ accessToken: accessToken })

    if (user) {
      const member = await Member.find({ username: user._id }).sort({ createdAt: -1 }).limit(20)
      res.status(200).json({
        success: true,
        response: member,
      });
    } else {
      res.status(401).json({
        success: false,
        response: "Please log in",
        loggedOut: true,
      });
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e,
      message: "Ground control... Abort Abort!",
    });
  }
});



app.post("/members", authenticateUser);
app.post("/members", async (req, res) => {
  try {
    const { message } = req.body;
    const accessToken = req.header("Authorization");
    const user = await User.findOne({accessToken: accessToken});
    const member = await new Member({
      message: message, 
      username: user._id
      
    }).save();
    res.status(201).json({
      success: true, 
      response: member
    })
  } catch (e) {
    res.status(500).json({
      success: false, 
      response: e, 
      message: "Not a workouter yet!"
    });
  }
})




// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
