import * as React from "react";
import * as S from 'semantic-ui-react'
import * as T from '../Types'
import * as R from '../Requests'
import {userInfoReq} from '../MockRequests'

export class Navigation extends React.Component<{}, {username: string}>{
    constructor(props: {}){
        super(props)
        this.state = {username: ""}
    }
    componentDidMount(){
        userInfoReq()
        .then(user => this.setState(p => ({...p, uesrname: user.attributes.user_name})))
    }
    logout = () => {
        T.logOut()
    }
    render(){
        return (
            <S.Menu secondary id="topmenu">
                <S.MenuItem>
                    <S.Header color="blue">BENTO</S.Header>
                </S.MenuItem>
                <S.Menu.Item position='right' style={{padding: "0"}}>
                    <S.ButtonGroup style={{marginRight: "20px"}}>
                        <S.Button as="a" target="_blank" href="https://github.com" basic color="blue" icon="github"/>
                        <S.Button as="a" target="_blank" href="/" basic color="blue" icon="home"/>
                    </S.ButtonGroup>
                    <S.Popup content="Log out"  trigger={
                        <S.Button onClick={this.logout} basic color="red" icon="power off"/>
                        }
                        position="bottom right"
                    />
                </S.Menu.Item>
            </S.Menu>
        )
    }
}