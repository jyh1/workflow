import * as React from "react";
// import {loginReq, getLoginStatus} from "./MockRequests"
import {loginReq, getLoginStatus} from "./Requests"
import {Redirect} from "react-router-dom";
import {Location} from 'history'
import * as T from './Types'
import { Button, Form, Header, ButtonProps, Grid, Message, Segment } from 'semantic-ui-react'

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

        if (loginStatus) return <Redirect to={T.endPointPath.mainapp + "/"} />;

        return (
            <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
                <Grid.Column style={{ maxWidth: 450 }}>
                <Header as='h2' color='blue' textAlign='center'>
                    Log-in with your <a href={T.endPointPath.codalab}>Codalab</a> account
                </Header>

                <Form error={this.state.loginError} warning={from != 'workflow/'} size='large'>
                    <Segment stacked>
                        <Form.Input
                            fluid
                            icon='user'
                            iconPosition='left'
                            name="username"
                            placeholder='Codalab Username'
                            autoFocus={true}
                            onChange={this.handleInputChange}
                            error={this.state.loginError}
                        />
                        <Form.Input
                            fluid
                            icon='lock'
                            name="password"
                            iconPosition='left'
                            placeholder='Password'
                            type='password'
                            autoComplete='off'
                            onChange={this.handleInputChange}
                            error={this.state.loginError}
                        />

                        <Message
                            error
                            header='Action Forbidden'
                            content='Wrong username or password'
                        />

                        <Button color='blue' fluid size='large' loading={this.state.loading} onClick={this.doLogin}>
                            Login
                        </Button>
                    </Segment>
                </Form>
                <Message
                    content={
                        <React.Fragment>
                            Login with your account at <a href="https://worksheets.codalab.org/">worksheets.codalab.org</a>.
                            Visit <a href="https://github.com/jyh1/workflow#authentication">here</a> for more information on the
                            backend setup.
                        </React.Fragment>
                    }
                />
                <Message>
                    <Message.List>
                        <Message.Item>
                            Don't have an account? <a href={T.endPointPath.codalab + "account/signup"}>Sign Up</a>
                        </Message.Item>
                        <Message.Item>
                            <a href={T.endPointPath.codalab + "account/reset"}>Forget your password?</a>
                        </Message.Item>
                    </Message.List>
                </Message>
                </Grid.Column>
            </Grid>
        );
    }
}
