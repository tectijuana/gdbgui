import ReactDOM from "react-dom";
import React from "react";
import "../../static/css/tailwind.css";

type GdbguiSession = {
  pid: number;
  start_time: string;
  command: string;
  client_ids: string[];
};
// @ts-ignore
const data: GdbguiSession[] = window.gdbgui_sessions;
// @ts-ignore
const csrf_token: string = window.csrf_token;
// @ts-ignore
const default_command: string = window.default_command;
function GdbguiSession(props: { session: GdbguiSession }) {
  const session = props.session;
  return (
    <tr>
      <td className="border px-4 py-2">{session.command}</td>
      <td className="border px-4 py-2">{session.pid}</td>
      <td className="border px-4 py-2">{session.client_ids.length}</td>
      <td className="border px-4 py-2">{session.start_time}</td>
      <td className="border px-4 py-2">
        {" "}
        <button
          className="leading-7 bg-blue-500 hover:bg-blue-700 border-blue-500 hover:border-blue-700 border-4 text-white py-2 px-2 rounded"
          type="button"
          onClick={() => {
            const params = new URLSearchParams({
              gdbpid: session.pid.toString()
            }).toString();
            redirect(`/?${params}`);
          }}
        >
          Connect to Session
        </button>
      </td>
      <td className="border px-4 py-2">
        {" "}
        <button
          className="leading-7 bg-red-500 hover:bg-red-700 border-red-500 hover:border-red-700 border-4 text-white py-2 px-2 rounded"
          type="button"
          onClick={async () => {
            await fetch("/kill_session", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ gdbpid: session.pid, csrf_token })
            });
          }}
        >
          Kill Session
        </button>
      </td>
    </tr>
  );
}

function redirect(url: string) {
  window.open(url, "_blank");
  setTimeout(() => window.location.reload(), 500);
}
class StartCommand extends React.Component<any, { value: string }> {
  constructor(props: {}) {
    super(props);
    // @ts-expect-error
    this.state = { value: window.default_command };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event: any) {
    this.setState({ value: event.target.value });
  }

  handleSubmit() {
    const params = new URLSearchParams({
      gdb_command: this.state.value
    }).toString();
    redirect(`/?${params}`);
  }

  render() {
    return (
      <>
        <div>Enter the gdb command to run in the session.</div>
        <div className="flex w-full mx-auto items-center container">
          <input
            type="text"
            className="flex-grow leading-9 bg-gray-900 text-gray-100 font-mono focus:outline-none focus:shadow-outline border border-gray-300 py-2 px-2 block appearance-none rounded-l-lg"
            value={this.state.value}
            onChange={this.handleChange}
            onKeyUp={event => {
              if (event.key.toLowerCase() === "enter") {
                this.handleSubmit();
              }
            }}
            placeholder="gdb --flag args"
          />
          <button
            className="flex-grow-0 leading-7 bg-green-500 hover:bg-green-700 border-green-500 hover:border-green-700 border-4 text-white py-2 px-2 rounded-r-lg"
            type="button"
            onClick={this.handleSubmit}
          >
            Start New Session
          </button>
        </div>
      </>
    );
  }
}

function Nav() {
  return (
    <nav className="flex items-center justify-between flex-wrap bg-blue-500 p-6">
      <div className="flex items-center flex-shrink-0 text-white mr-6">
        <span className="font-semibold text-xl tracking-tight">gdbgui</span>
      </div>

      <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
        <div className="text-sm lg:flex-grow">
          <a
            href="https://gdbgui.com"
            className="block mt-4 lg:inline-block lg:mt-0 text-blue-200 hover:text-white mr-4"
          >
            Docs
          </a>
          <a
            href="https://www.youtube.com/channel/UCUCOSclB97r9nd54NpXMV5A"
            className="block mt-4 lg:inline-block lg:mt-0 text-blue-200 hover:text-white mr-4"
          >
            YouTube
          </a>
          <a
            href="https://github.com/cs01/gdbgui"
            className="block mt-4 lg:inline-block lg:mt-0 text-blue-200 hover:text-white mr-4"
          >
            GitHub
          </a>
          <a
            href="https://www.paypal.com/paypalme/grassfedcode/20"
            className="block mt-4 lg:inline-block lg:mt-0 text-blue-200 hover:text-white mr-4"
          >
            Donate
          </a>
        </div>
      </div>
    </nav>
  );
}

class Dashboard extends React.PureComponent<any, { sessions: GdbguiSession[] }> {
  interval: NodeJS.Timeout | undefined;
  constructor(props: {}) {
    super(props);
    this.state = { sessions: data };
    this.updateData = this.updateData.bind(this);
  }
  async updateData() {
    const response = await fetch("/dashboard_data");
    const sessions = await response.json();
    this.setState({ sessions });
  }
  componentDidMount() {
    this.interval = setInterval(this.updateData, 5000);
  }
  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
  render() {
    const sessions = this.state.sessions.map((d, index) => (
      <GdbguiSession key={index} session={d} />
    ));
    return (
      <>
        <Nav />
        <div className="w-full h-full bg-gray-300 text-center p-5">
          <div className="text-3xl font-semibold">Start new session</div>
          <StartCommand />
          <div className="mt-5 text-3xl font-semibold">
            {sessions.length === 1
              ? "There is 1 gdbgui session running"
              : `There are ${sessions.length} gdbgui sessions running`}
          </div>
          <table className="table-auto mx-auto">
            <thead>
              <tr>
                <th className="px-4 py-2">Command</th>
                <th className="px-4 py-2">PID</th>
                <th className="px-4 py-2">Connected Browsers</th>
                <th className="px-4 py-2">Start Time</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>{sessions}</tbody>
          </table>
        </div>
      </>
    );
  }
}

ReactDOM.render(<Dashboard />, document.getElementById("dashboard"));
