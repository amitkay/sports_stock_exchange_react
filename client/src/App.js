import React from 'react';
import logo from './logo.svg';
import './App.css';
import { GoogleLogin } from 'react-google-login';
import axios from 'axios'; 
class App extends React.Component
{
  constructor(props) {
    super(props);
    this.state = {nm: "Name",
    photo:''
  };
  }
  componentDidMount() {
    this.callApi()
      .then(res => this.setState({ response: res.express }))
      .catch(err => console.log(err));
  }
  
  callApi = async () => {
    const response = await fetch('/api/hello');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    
    return body;
  };
  
   responseGoogle=async(response)=>{
    console.log(response);
    this.setState({nm:response.profileObj.givenName});
    this.setState({photo:response.profileObj.imageUrl});
    const response2 = await fetch('/api/world', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ post: 'yo aay here' }),
    });
    const body = await response2.text();
    alert(body);
    //alert(response.profileObj.imageUrl);
  }
render()
{
  return (
    <div>
 <GoogleLogin
    clientId="341903562763-9v5knev6akeb4hb8vv76m7u8h2e2kc3b.apps.googleusercontent.com"
    buttonText="Login"
    onSuccess={this.responseGoogle}
    onFailure={this.responseGoogle}
    cookiePolicy={'single_host_origin'}
  />
  <img 
      src={this.state.photo}
      />
  <h1>{this.state.nm}</h1>
    </div>
  );
}
}
export default App;
