const { buildSchema } = require("graphql");

module.exports = buildSchema(`
        type Post {
            _id : ID ! 
            title : String ! 
            content : String ! 
            imageUrl : String ! 
            creator : String !
            createdAt : String !
            updatedAt : String !   
        }

        type User {
            _id : ID !
            name : String ! 
            email : String ! 
            password : String 
            status : String !
            posts : [Post!]!
        }
        type AuthData {
            token : String ! 
            user_id : Int !
        }    
        type postData {
            posts : [Post !]!
            totalPosts : Int !  

        }    
        input PostInputData {
            title : String ! 
            content : String ! 
            imageUrl : String ! 
        }
        
        input UserInputsData  {
            email : String !
            password : String !
            name : String ! 
        }

        type RootQuery {
            login (email : String ! ,password : String !): AuthData 
            Posts (page: Int ): postData !
            Post(postId : ID !): Post! 
            Status : String !
        }

        type RootMutation {
            createUser(userInput:UserInputsData) : User!
            createPost(postInput:PostInputData): Post 
            updatePost(id : ID ! ,postInput : PostInputData) : Post ! 
            deletePost(id : ID!): Boolean!
            updateStatus(status : String !) : User !
        }
        
        schema {
            query : RootQuery 
            mutation : RootMutation    
        }

`);
