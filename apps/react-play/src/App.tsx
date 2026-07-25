import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { useDraft } from 'howie-daily-helpers-react-hooks';

function App() {
  const [draftCount, draftCountApi] = useDraft({ initialValue: 1, storageKey: 'count' });

  return (
    <>
      <div>
        { draftCount.isSaving ? 'saving...' : 'saved' }
        <a href='https://vite.dev' target='_blank'>
          <img src={viteLogo} className='logo' alt='Vite logo' />
        </a>
        <a href='https://react.dev' target='_blank'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className='card'>
        <button onClick={() => {
          draftCountApi.undo();
        }}>
          undo is {draftCount.curDraft}
        </button>
        <button onClick={() => {
          console.log(draftCount.curDraft)
          draftCountApi.onChangeDraft(draftCount.curDraft + 1);
        }}>
          count is {draftCount.curDraft}
        </button>
        <button onClick={() => {
          draftCountApi.redo();
        }}>
          redo is {draftCount.curDraft}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className='read-the-docs'>
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
