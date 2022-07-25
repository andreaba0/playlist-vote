import Head from "next/head";

export function HeadComponent(props) {
    return (
        <Head>
            <title>{props.title}</title>
        </Head>
    )
}