import React, { Component } from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';
import { graphql } from 'graphql';

class SinglePost extends Component {
  state = {
    title: '',
    author: '',
    date: '',
    image: '',
    content: ''
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;
    const graphQlQuery = {
      query : `
       query LoadPost($postId : ID !){
        Post(postId : $postId)
        {
                _id title content  createdAt creator  imageUrl       
        }
    }`, variables : {
      postId : postId
    }
    }
    fetch('http://localhost:300/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token, 
        'Content-Type': 'application/json'
      },
      body : JSON.stringify(graphQlQuery)
    })
      .then(res => {
       
        return res.json();
      })
      .then(resData => {
        console.log(resData.data.Post.imageUrl)
        if(resData.errors){
          throw new Error(resData.errors[0].message)
        }
        this.setState({
          title: resData.data.Post.title,
          author: resData.data.Post.creator.name,
          image: 'http://localhost:300/' + resData.data.Post.imageUrl,
          date: new Date(resData.data.Post.createdAt).toLocaleDateString('en-US'),
          content: resData.data.Post.content
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    console.log(this.state.image)
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
    );
  }
}

export default SinglePost;
