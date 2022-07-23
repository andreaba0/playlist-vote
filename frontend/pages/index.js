export async function getServerSideProps(context) {
    return {
        redirect: {
            permanent: false,
            destination: '/playlist/list'
        }
    }
}

export default function Home(props) {
    return (
        <div>
            Hello World
        </div>
    )
}