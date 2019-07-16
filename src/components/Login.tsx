import * as React from "react";
// import {loginReq, getLoginStatus} from "./MockRequests"
import {loginReq, getLoginStatus} from "./Requests"
import {Redirect} from "react-router-dom";
import {Location} from 'history'
import { Button, Form, Header, ButtonProps, Container, Message } from 'semantic-ui-react'

type Props = {location: Location}
type State = {username: string, password: string, from: string, loginStatus: boolean, loginError: boolean, loading: boolean}

export class Login extends React.Component<Props, State> {
    /** Constructor. */
    constructor(props: Props) {
        super(props);
        let fromPathname = '/';
        if (this.props.location.state && this.props.location.state.from) {
            fromPathname = this.props.location.state.from.pathname;
        }

        this.state = {
            loginStatus: getLoginStatus(),
            username: '',
            password: '',
            loginError: false,
            from: fromPathname,
            loading: false
        };
    }

    handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target
        const name = target.name
        const value = target.value
        this.setState((prev) => Object.assign(prev, {[name]: value, loginError: false}));
    };

    doLogin = (event:React.MouseEvent<HTMLButtonElement>, butt: ButtonProps) => {
        this.setState(prev => Object.assign(prev, {loading: true}))
        loginReq(this.state.username, this.state.password)
        .then((unit) => this.setState(prev => Object.assign(prev, {loginStatus: true, loading: false})))
        .catch(x => this.setState(prev => Object.assign(prev, {loginError: true, loading: false})))
    }

    render() {
        const pathname = this.props.location.pathname;

        let { loginStatus, from } = this.state;

        if (loginStatus) return <Redirect to={from} />;

        return (
            <Container>
                <Header as='h3' >Login</Header>
                <Form error={this.state.loginError} warning={from != '/'}>
                    <Message
                        warning
                        header='Login required'
                        list={['You must log in to view the page at ' + from]}
                    />
                    <Form.Field required>
                        <Form.Input
                            label='Username' 
                            placeholder="Username or e-mail" 
                            name="username"
                            type='text'
                            autoFocus={true}
                            onChange={this.handleInputChange}
                            error={this.state.loginError}
                        />
                    </Form.Field>
                    <Form.Field required>
                        <Form.Input
                            label="Password"
                            placeholder="Password"
                            name="password"
                            type="password"
                            autoComplete='off'
                            onChange={this.handleInputChange}
                            error={this.state.loginError}
                        />
                    </Form.Field>
                    <Message
                        error
                        header='Action Forbidden'
                        content='Wrong username or password'
                    />
                    <Button primary loading={this.state.loading} onClick={this.doLogin}>Login</Button>
                    {/* <p>
                        <a href='/account/signup'>Don't have an account? Sign up!</a>
                    </p>
                    <p>
                        <a href='/account/reset'>Forgot your password?</a>
                    </p>
                    <a
                        href=''
                        onClick={(event) => {
                            alert(
                                'Please log in and navigate to your dashboard to resend confirmation email.',
                            );
                            event.preventDefault();
                        }}
                    >
                        Resend confirmation email
                    </a> */}
                </Form>
            </Container>
        );
    }
}
