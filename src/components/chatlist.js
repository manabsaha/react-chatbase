import axios from 'axios';
import React, { Component, useEffect, useRef, useState } from 'react';
import './chatlist.css';


function Chatlist(props){
    const username=props.username;
    const [chats, setChats] = useState([]);
    const [msg, setMsg] = useState('');
    const [tables, setTables] = useState([]);
    const base = "http://localhost:3001";

    const onButtonClick=(id)=>{
        props.setChatId(id);
    }

    useEffect(()=>{
        if (tables.length>0)
        {
            if(tables.includes(username+msg)||tables.includes(msg+username))
            {   
                props.setChatId(tables.includes(username+msg)?username+msg:msg+username);
            }
            else{
                console.log("tables: "+tables);
                axios.post(base + "/createchat", {
                    touser: msg,
                    curuser:username,
        
                }).then(() => {
                    alert("success");
                });
                alert("table created... refresh page to view changes");
            }

        }
        
    },[tables]);

    const handleSubmit = (evt) => {
        evt.preventDefault();
        chats.map(x=> {setTables(tables => [...tables,x.table_id])});
    }
        useEffect(() => {
            axios.get(base + "/chatlist", {
                params: {
                    user: username,
                }}).then( response => {
                    setChats(response.data);
            });
        },[]);
    

    return(
        <div>
            <div>
            {chats.map(data => (
                <p><button value={data.table_id} onClick={()=>onButtonClick(data.table_id)}> {(data.user1==username)?data.user2:data.user1}</button>
                    <br></br>
                </p>
            ))}
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Enter user name to chat" onChange={e => setMsg(e.target.value)}/>
                    <button type="submit">submit</button>
                </form>
            </div>
            
        </div>
    );

}

export default Chatlist;