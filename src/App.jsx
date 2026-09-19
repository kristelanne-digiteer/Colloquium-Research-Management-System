import AuthorSubmissionForm from "./components/AuthorSubmissionForm";

function App() {
  return <AuthorSubmissionForm onSubmit={(data) => console.log(data)} />;
}

export default App;