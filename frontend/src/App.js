import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Switch, Route } from 'react-router-dom'
import LoginFormModal from './components/LoginFormModal';
import Navigation from './components/Navigation';
import SignupFormPage from './components/SignupFormModal';
import { restoreUser } from './store/session';

function App() {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    dispatch(restoreUser())
      .then(() => setIsLoaded(true));
  }, [dispatch])


  return (
    <div className="page-container">
      <Navigation isLoaded={isLoaded} />
      {isLoaded && (
        <Switch>
          <Route path='/signup' component={SignupFormPage} />
          <h1>Authenticate Me Template</h1>
        </Switch>
      )}
    </div>
  );
}

export default App;
